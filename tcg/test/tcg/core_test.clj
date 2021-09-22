(ns tcg.core-test
  (:require [clojure.test :refer [deftest is testing]]
            [tcg.core :as tcg]))

(deftest test-new-deck
  (let [a (tcg/new-deck)
        b (tcg/new-deck)]
    (is (= (sort a) (sort b)))))

(deftest test-drawing-moves-card-from-deck-to-hand
  (let [player {:deck '(1 2) :hand []}
        result (tcg/draw player)]
    (is (= result {:deck [2] :hand [1]}))))

(deftest test-mana-refill
  (let [player {:max-mana 8 :mana 3}
        result (tcg/refill-mana player)]
    (is (= result {:max-mana 8 :mana 8}))))

(deftest test-mana-increase
  (is (= (tcg/increase-max-mana {:max-mana 8}) {:max-mana 9}))
  (is (= (tcg/increase-max-mana {:max-mana 10}) {:max-mana 10})))

(deftest test-start-turn
  (let [player {:deck '(1 2) :hand [] :max-mana 8 :mana 3}
        result (tcg/start-turn player)]
    (is (= result {:deck [2] :hand [1] :max-mana 9 :mana 9}))))

(deftest test-play-a-card
  (let [player {:hand [2] :mana 2}
        result (tcg/play-card player 2)]
    (is (= result {:hand [] :mana 0})))
  (let [player {:hand [2 2] :mana 2}
        result (tcg/play-card player 2)]
    (is (= result {:hand [2] :mana 0}))))

(deftest test-deal-damage
  (testing "damage < health"
    (let [player {:health 10}
          result (tcg/deal-damage player 2)]
      (is (= result {:health 8}))))
  (testing "damage > health"
    (let [player {:health 2}
          result (tcg/deal-damage player 4)]
      (is (= result {:health 0})))))

(deftest test-attack
  (let [state {:attacker {:hand [2] :mana 2}
               :defender {:health 10}}
        result (tcg/attack state 2)]
    (is (= result {:attacker {:hand [] :mana 0}
                   :defender {:health 8}}))))

(deftest test-finish-turn
  (let [state {:attacker {:hand [2] :mana 2}
               :defender {:health 10}}
        result (tcg/finish-turn state)]
    (is (= result {:attacker {:health 10}
                   :defender {:hand [2] :mana 2}}))))

(deftest test-deal
  (let [state (tcg/deal)]
    (is (= (count (:hand state)) 3))
    (is (= (sort (concat (:hand state) (:deck state)))
           (sort (tcg/new-deck))))))
