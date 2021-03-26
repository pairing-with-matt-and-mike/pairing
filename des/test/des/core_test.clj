(ns des.core-test
  (:require [clojure.test :refer [deftest is]]
            [des.core :refer :all])
  (:import [java.util.concurrent
            LinkedBlockingQueue
            TimeUnit]))

(defn wait-for [mailbox pred]
  (loop [received []]
    (if (some pred received)
      received
      (if-let [message (.poll mailbox 1 TimeUnit/SECONDS)]
        (recur (conj received message))
        (throw (Exception. "No message received"))))))

(defn start-ring [n]
  (let [bootstrap-node (make-bootstrap-node :bootstrap)
        nodes (map #(make-node % bootstrap-node) (range n))
        debug-mailbox (LinkedBlockingQueue.)
        registry (into {}
                       (map #(vector (:id %) (:mailbox %)))
                       (conj nodes bootstrap-node))]
    (register-node registry (:id bootstrap-node) :debug debug-mailbox)
    (doseq [n nodes]
      (wait-for debug-mailbox (fn [{:keys [op]}] (= op :register-ack))))

    {:bootstrap-node bootstrap-node
     :debug-mailbox debug-mailbox
     :registry registry
     :node-ids (mapv :id nodes)
     :stop-fn #(doseq [n (conj nodes bootstrap-node)]
                 (stop-node registry (:id n))
                 (wait-node n))}))

(deftest node-replies-to-ping-with-pong
  (let [{:keys [debug-mailbox registry node-ids stop-fn]} (start-ring 2)]
    (ping-node registry (first node-ids) :debug)
    (stop-fn)
    (wait-for debug-mailbox (fn [{:keys [op]}] (= op :pong)))
    (is true)))

(deftest node-consistent-hashing-ish
  (let [{:keys [debug-mailbox registry node-ids stop-fn]} (start-ring 2)]
    (try
      (put-node registry (first node-ids) :a 1)
      (get-node registry (second node-ids) :a :debug)
      (wait-for debug-mailbox #(= % {:op :result :args [1]}))
      (is true)
      (finally (stop-fn)))))

(deftest node-consistent-hashing-get-with-three-nodes
  (let [{:keys [debug-mailbox registry node-ids stop-fn]} (start-ring 3)]
    (try
      (put-node registry (nth node-ids 2) :a 1)
      (Thread/sleep 1000)
      (get-node registry (nth node-ids 0) :a :debug)
      (wait-for debug-mailbox #(= % {:op :result :args [1]}))
      (is true)
      (finally (stop-fn)))))

#_(deftest node-consistent-hashing-get-non-existent-key
  (let [{:keys [debug-mailbox registry node-ids stop-fn]} (start-ring)]
    (try
      (get-node registry (second node-ids) :not-there :debug)
      (wait-for debug-mailbox #(= % {:op :result :args [1]}))
      (is true)
      (finally (stop-fn)))))
