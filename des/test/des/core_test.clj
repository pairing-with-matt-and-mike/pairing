(ns des.core-test
  (:require [clojure.test :refer [deftest is]]
            [des.core :refer :all])
  (:import [java.util.concurrent LinkedBlockingQueue]))

(deftest node-replies-to-ping-with-pong
  (let [bootstrap-node (make-bootstrap-node :bootstrap)
        n1 (make-node :node-1 bootstrap-node)
        debug-mailbox (LinkedBlockingQueue.)
        nodes [n1]
        registry (into {}
                       (map #(vector (:id %) (:mailbox %)))
                       (conj nodes bootstrap-node))
        wait-for (fn [pred] (loop [received []]
                              (if (some pred received)
                                received
                                (recur (conj received (.take debug-mailbox))))))]
    (register-node registry (:id bootstrap-node) :debug debug-mailbox)
    (wait-for (fn [{:keys [op]}] (= op :pong)))
    (ping-node registry (:id n1) :debug)
    (doseq [n (conj nodes bootstrap-node)]
      (stop-node registry (:id n))
      (wait-node n))
    (wait-for (fn [{:keys [op]}] (= op :pong)))))
