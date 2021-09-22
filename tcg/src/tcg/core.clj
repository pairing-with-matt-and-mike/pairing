(ns tcg.core)

(defn new-deck [] (into '() (shuffle [0 0 1 1 2 2 2 3 3 3 3 4 4 4 5 5 6 6 7 8])))

(defn draw [player]
  (let [card (-> player :deck peek)]
    (-> player
        (update :deck pop)
        (update :hand conj card))))

(defn refill-mana [player]
  (let [new-mana (:max-mana player)]
    (assoc player :mana new-mana)))

(defn increase-max-mana [player]
  (let [new-max-mana (min 10 (inc (:max-mana player)))]
    (assoc player :max-mana new-max-mana)))

(defn start-turn [player]
  (-> player increase-max-mana refill-mana draw))

(defn remove-one [predicate values]
  (->> values
       (reduce (fn [{:keys [values removed]} value]
                 (if (and (not removed) (predicate value))
                   {:values values :removed true}
                   {:values (cons value values) :removed removed}))
               {:values '() :removed false})
       :values))

(defn play-card [player mana]
  (-> player
      (update :hand #(remove-one #{mana} %))
      (update :mana - mana)))

(defn deal-damage [player damage]
  (let [new-health (-> player :health (- damage) (max 0))]
    (assoc player :health new-health)))

(defn attack [state mana]
  (let [{:keys [attacker defender]} state]
    {:attacker (play-card attacker mana)
     :defender (deal-damage defender mana)}))

(defn finish-turn [state]
  {:attacker (:defender state) :defender (:attacker state)})

(defn deal []
  (-> draw
      (iterate {:deck (new-deck)
                :hand []
                :max-mana 0
                :mana 0
                :health 10})
      (nth 3)))

(comment

  (def s (atom {:attacker (deal)
                :defender (deal)}))

  (let [card (-> @s :attacker :hand rand-nth)]
    (swap! s update :attacker start-turn)
    (swap! s attack card)
    (swap! s finish-turn))

  )
