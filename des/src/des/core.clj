(ns des.core
  (:require [clojure.pprint :as pp])
  (:import [java.util.concurrent LinkedBlockingQueue TimeUnit]))

(defn log [id msg]
  (println (str "[" id "] => " (or msg "nil"))))

(defn gen-id []
  (Math/abs (hash (java.util.UUID/randomUUID))))

(defn send-msg [registry recipient-id msg]
  (if-let [mailbox (registry recipient-id)]
    (.offer mailbox msg)
    (println "Error: Node not registered: " recipient-id (:op msg))))

(defn put-node [registry id key val]
  (send-msg registry id {:op :put :args [key val]}))

(defn get-node [registry id k recipient-id]
  (send-msg registry id {:op :get :args [k recipient-id]}))

(defn register-node [registry id my-id my-mailbox]
  (send-msg registry id {:op :register :args [my-id my-mailbox]}))

(defn register-ack-node [registry id my-id]
  (send-msg registry id {:op :register-ack :args [my-id]}))

(defn deregister-node [registry id my-id]
  (send-msg registry id {:op :deregister :args [my-id]}))

(defn ping-node [registry id my-id]
  (send-msg registry id {:op :ping :args [my-id]}))

(defn pong-node [registry id]
  (send-msg registry id {:op :pong}))

(defn register [registry id mailbox]
  (swap! registry assoc id mailbox))

(defn deregister [registry id]
  (swap! registry dissoc id))

(defn make-task
  ([id init-registry f]
   (let [mailbox (LinkedBlockingQueue.)
         registry (atom init-registry)]
     (doseq [other-id (keys init-registry)]
       (register-node init-registry other-id id mailbox))
     {:thread (future
                (log id "starting...")
                (loop [msg (.poll mailbox 500 TimeUnit/MILLISECONDS)]
                  (log id (:op msg))
                  (when (not= :quit (:op msg))
                    (when msg
                      (f registry msg))
                    (recur (.poll mailbox 500 TimeUnit/MILLISECONDS))))
                (log id "quitting...")
                (let [registry* @registry]
                  (doseq [other-id (keys registry*)]
                    (deregister-node registry* other-id id)))
                (log id "deregistered"))
      :mailbox mailbox
      :id id})))

(defn exec-command [my-id state registry msg]
  (let [{:keys [op args]} msg]
    (case op
      :put (let [[k v] args
                 owner-id (mod (hash k) 2)]
             (if (= my-id owner-id)
               (swap! state assoc k v)
               (send-msg @registry owner-id msg)))

      :get (let [[k recipient-id] args
                 owner-id (mod (hash k) 2)]
             (if (= my-id owner-id)
               (send-msg @registry recipient-id {:op :result :args [k (@state k)]})
               (send-msg @registry owner-id msg)))
      :register (let [[id mailbox] args]
                  (register registry id mailbox)
                  (register-ack-node @registry id my-id))
      :register-ack nil
      :deregister (let [[id] args] (deregister registry id))
      :ping (let [[id] args]
              (pong-node @registry id))
      :pong nil
      (println "unknown op:" (:op msg)))))

(defn make-node
  ([bootstrap-node]
   (make-node (gen-id) bootstrap-node))
  ([my-id bootstrap-node]
   (let [state (atom {})]
     (make-task my-id
                {(:id bootstrap-node) (:mailbox bootstrap-node)}
                (fn [registry msg]
                  (exec-command my-id state registry msg))))))

(defn make-bootstrap-node
  ([]
   (make-bootstrap-node (gen-id)))
  ([id]
   (make-task id
              {}
              (fn [registry msg]
                (try 
                  (let [{:keys [op args]} msg]
                    (case op
                      :register (let [[new-id new-mailbox] args
                                      existing-registry @registry]
                                  (register registry new-id new-mailbox)
                                  (doseq [[existing-id existing-mailbox] existing-registry]
                                    (register-node @registry existing-id new-id new-mailbox)
                                    (register-node @registry new-id existing-id existing-mailbox)))
                      :deregister (deregister registry (first args))
                      (println "unknown op:" (:op msg))))
                  (catch Exception e
                    (log id (str "exception" e))
                    (throw e)))))))

(defn stop-node [registry id]
  (send-msg registry id {:op :quit}))

(defn wait-node [node]
  (-> node :thread deref))

(defn make-println-node
  ([id]
   (make-task id {} (fn [registry msg] (log id msg)))))

(defn main [args]
  (let [bootstrap-node (make-bootstrap-node :bootstrap)
        n1 (make-node :node-1 bootstrap-node)
        n2 (make-node :node-2 bootstrap-node)
        debug-mailbox (LinkedBlockingQueue.)
        nodes [n1 n2]
        registry (into {}
                       (map #(vector (:id %) (:mailbox %)))
                       (conj nodes bootstrap-node))]
    (register-node registry (:id bootstrap-node) :debug debug-mailbox)
    (put-node registry (:id n1) :a 10)
    (put-node registry (:id n2) :b 20)
    (Thread/sleep 1000)
    (get-node registry (:id n1) :a :debug)
    (get-node registry (:id n2) :b :debug)
    (ping-node registry (:id n1) :debug)
    (doseq [n (conj nodes bootstrap-node)]
      (stop-node registry (:id n))
      (wait-node n))
    (pp/pprint (seq debug-mailbox)))
  ;; clean up after the futures
  (shutdown-agents))
