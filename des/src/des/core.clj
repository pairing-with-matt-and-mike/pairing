(ns des.core)

(defn log [id msg]
  (println (str "[" id "] => " msg)))

(defn send-msg [registry recipient-id msg]
  (if-let [mailbox (@registry recipient-id)]
    (swap! mailbox conj msg)
    (throw (Exception. (str "Node not registered: " recipient-id)))))

(defn put-node [registry id key val]
  (send-msg registry id {:op :put :args [key val]}))

(defn get-node [registry id k recipient-id]
  (send-msg registry id {:op :get :args [k recipient-id]}))

(defn register-node [registry id my-id my-mailbox]
  (send-msg registry id {:op :register :args [my-id my-mailbox]}))

(defn register [registry id & [mailbox]]
  (swap! registry assoc id mailbox))

(defn deregister-node [registry id my-id]
  (send-msg registry id {:op :deregister :args [my-id]}))

(defn gen-id []
  (Math/abs(.hashCode (java.util.UUID/randomUUID))))

(defn exec-command [state registry msg]
  (let [{:keys [op args]} msg]
    (case op
      :put (apply assoc state args)
      :get (let [[k recipient-id] args
                 v (state k)]
             (send-msg registry recipient-id {:op :result :args [v]}))
      :register (let [[id mailbox] args] (register registry id mailbox))
      :deregister (let [[id] args] (register registry id))
      (println "ignoring msg:" msg))))

(defn make-task
  ([id f]
   (let [go? (atom true)
         mailbox (atom clojure.lang.PersistentQueue/EMPTY)
         registry (atom {})]
     {:thread (future
                (log id "starting...")
                (while (or @go? (peek @mailbox))
                  (if-let [msg (peek @mailbox)]
                    (do (swap! mailbox pop)
                        (f registry msg))
                    (Thread/sleep 500)))
                (log id "quitting...")
                (doseq [other-id (keys @registry)]
                  (deregister-node registry other-id id))
                (log id "deregistered"))
      :mailbox mailbox
      :go? go?
      :id id})))

(defn make-node
  ([]
   (make-node (gen-id)))
  ([id]
   (let [state (atom {})]
     (make-task id (fn [registry msg]
                     (log id msg)
                     (swap! state exec-command registry msg))))))

(defn stop-node [node]
  (-> node :go? (reset! false)))

(defn wait-node [node]
  (-> node :thread deref))

(defn make-println-node
  ([id]
   (make-task id (fn [registry msg] (log id msg)))))

(defn main [args]
  (let [n (make-node)
        dn (make-println-node :debug)
        nodes [n dn]
        registry (atom (into {} (map #(vector (:id %) (:mailbox %)) nodes)))]
    (register-node registry (:id n) :debug (:mailbox dn))
    (put-node registry (:id n) :a 10)
    (get-node registry (:id n) :a :debug)
    (doseq [n nodes]
      (stop-node n)
      (wait-node n))
    (println @registry)
    ;; cleanup after the futures
    (shutdown-agents)))
