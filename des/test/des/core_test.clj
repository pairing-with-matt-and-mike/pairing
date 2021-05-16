(ns des.core-test
  (:require [clojure.test :refer [deftest is]]
            [des.core :refer :all])
  (:import [java.util.concurrent
            LinkedBlockingQueue
            TimeUnit]))

(defmacro wait-for [mailbox binding body]
  `(let [pred# (fn ~binding ~body)]
     (loop [received# nil]
       (if (pred# received#)
         received#
         (if-let [message# (.poll ~mailbox 1 TimeUnit/SECONDS)]
           (recur message#)
           (throw (Exception. (str "No message received " '~body))))))))

(defn start-ring [n]
  (let [bootstrap-node (make-bootstrap-node)
        nodes (repeatedly n #(make-node bootstrap-node))
        debug-mailbox (LinkedBlockingQueue.)
        registry (into {}
                       (map #(vector (:id %) %))
                       (conj nodes bootstrap-node))]
    (send-register registry (:id bootstrap-node) {:id :debug :mailbox debug-mailbox})
    (doseq [n nodes]
      (wait-for debug-mailbox [{:keys [op]}] (= op :register-ack)))
    {:bootstrap-node bootstrap-node
     :debug-mailbox debug-mailbox
     :registry registry
     :node-ids (mapv :id nodes)
     :stop-fn #(doseq [n (conj nodes bootstrap-node)]
                 (send-quit registry (:id n))
                 (wait-node n))}))

(deftest node-replies-to-ping-with-pong
  (let [{:keys [debug-mailbox registry node-ids stop-fn]} (start-ring 2)]
    (send-ping registry (first node-ids) :debug)
    (stop-fn)
    (wait-for debug-mailbox [{:keys [op]}] (= op :pong))
    (is true)))

(defn send-get-and-await-result [registry debug-mailbox node-id k]
  (loop []
    (send-get registry node-id k :debug)
    (let [result-msg (wait-for debug-mailbox [{:keys [op]}] (= op :result))]
      (if (= result-msg {:op :result :args [:a nil]})
        (recur)
        result-msg))))

(deftest node-consistent-hashing-ish
  (let [{:keys [debug-mailbox registry node-ids stop-fn]} (start-ring 2)]
    (try
      (send-put registry (first node-ids) :a 1)
      (is (= (send-get-and-await-result registry debug-mailbox (nth node-ids 0) :a)
             {:op :result :args [:a 1]}))
      (finally (stop-fn)))))

(deftest node-consistent-hashing-get-with-three-nodes
  (let [{:keys [debug-mailbox registry node-ids stop-fn]} (start-ring 3)]
    (try
      (send-put registry (nth node-ids 2) :a 1)
      (is (= (send-get-and-await-result registry debug-mailbox (nth node-ids 0) :a)
             {:op :result :args [:a 1]}))
      (finally (stop-fn)))))

(deftest node-consistent-hashing-get-non-existent-key
  (let [{:keys [debug-mailbox registry node-ids stop-fn]} (start-ring 3)]
    (try
      (send-get registry (second node-ids) :not-there :debug)
      (wait-for debug-mailbox [msg] (= msg {:op :result :args [:not-there nil]}))
      (is true)
      (finally (stop-fn)))))
