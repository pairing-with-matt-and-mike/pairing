(ns des.core
  (:require [clojure.pprint :as pp])
  (:import [java.util.concurrent LinkedBlockingQueue TimeUnit]
           [java.security MessageDigest]
           [java.math BigInteger]))

(defn md5 [^String s]
  (let [algorithm (MessageDigest/getInstance "MD5")
        raw (.digest algorithm (.getBytes s))]
    (BigInteger. 1 raw)))

(defn log [id msg]
  (println (str "[" id "] => " (or msg "nil"))))

(defn gen-id []
  (Math/abs (hash (java.util.UUID/randomUUID))))

(defn send-msg [registry recipient-id msg]
  (if-let [{:keys [mailbox]} (registry recipient-id)]
    (.offer mailbox msg)
    (println "Error: Node not registered: " recipient-id (:op msg))))

(defn send-put [registry id key val]
  (send-msg registry id {:op :put :args [key val]}))

(defn send-get [registry id k recipient-id]
  (send-msg registry id {:op :get :args [k recipient-id]}))

(defn send-register [registry id arg]
  (send-msg registry id {:op :register :args [arg]}))

(defn send-register-ack [registry id my-id]
  (send-msg registry id {:op :register-ack :args [my-id]}))

(defn send-deregister [registry id my-id]
  (send-msg registry id {:op :deregister :args [my-id]}))

(defn send-ping [registry id my-id]
  (send-msg registry id {:op :ping :args [my-id]}))

(defn send-pong [registry id]
  (send-msg registry id {:op :pong}))

(defn register [registry arg]
  (swap! registry assoc (:id arg) arg))

(defn deregister [registry id]
  (swap! registry dissoc id))

(defn send-quit [registry id]
  (send-msg registry id {:op :quit}))

(defn wait-node [node]
  (-> node :thread .join))

(defn make-task
  ([id init-registry f]
   (let [mailbox (LinkedBlockingQueue.)
         registry (atom init-registry)
         thread (Thread.
                 #(do (log id "starting...")
                      (loop [msg (.poll mailbox 500 TimeUnit/MILLISECONDS)]
                        (log id (:op msg))
                        (when (not= :quit (:op msg))
                          (when msg
                            (f registry msg))
                          (recur (.poll mailbox 500 TimeUnit/MILLISECONDS))))
                      (log id "quitting...")
                      (let [registry* @registry]
                        (doseq [other-id (keys registry*)]
                          (send-deregister registry* other-id id)))
                      (log id "deregistered")))]
     (doseq [other-id (keys init-registry)]
       (send-register init-registry other-id {:id id :mailbox mailbox :role :storage}))
     (.start thread)
     {:thread thread
      :mailbox mailbox
      :id id})))

(defn find-owner-id [storage-node-ids k]
  (let [h #(md5 (str (hash %)))
        h->id (->> storage-node-ids (map (juxt h identity)) (into {}))
        ordered-hashes (sort (keys h->id))
        key-hash (md5 (str (hash k)))
        target-hash (or (first (drop-while #(< key-hash %) ordered-hashes)) (first ordered-hashes))]
    (h->id target-hash)))

(defn exec-command [my-id state registry msg]
  (let [{:keys [op args]} msg
        storage-node-ids (->> @registry vals (filter #(= :storage (:role %))) (map :id) (into [my-id]))]
    (case op
      :put (let [[k v] args
                 owner-id (find-owner-id storage-node-ids k)]
             (if (= my-id owner-id)
               (swap! state assoc k v)
               (send-msg @registry owner-id msg)))
      :get (let [[k recipient-id] args
                 owner-id (find-owner-id storage-node-ids k)]
             (if (= my-id owner-id)
               (send-msg @registry recipient-id {:op :result :args [k (@state k)]})
               (send-msg @registry owner-id msg)))
      :register (let [[arg] args]
                  (register registry arg)
                  (send-register-ack @registry (:id arg) my-id))
      :register-ack nil
      :deregister (let [[id] args] (deregister registry id))
      :ping (let [[id] args]
              (send-pong @registry id))
      :pong nil
      (println "unknown op:" (:op msg)))))

(defn make-node
  ([bootstrap-node]
   (make-node (gen-id) bootstrap-node))
  ([my-id bootstrap-node]
   (let [state (atom {})]
     (make-task my-id
                {(:id bootstrap-node) {:id (:id bootstrap-node) :mailbox (:mailbox bootstrap-node)}}
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
                      :register (let [[arg] args
                                      existing-registry @registry]
                                  (register registry arg)
                                  (doseq [existing-arg (vals existing-registry)]
                                    (send-register @registry (:id existing-arg) arg)
                                    (send-register @registry (:id arg) existing-arg)))
                      :deregister (deregister registry (first args))
                      (println "unknown op:" (:op msg))))
                  (catch Exception e
                    (log id (str "exception" e))
                    (throw e)))))))

(defn make-println-node
  ([id]
   (make-task id {} (fn [registry msg] (log id msg)))))
