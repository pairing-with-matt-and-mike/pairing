(ns aoc.core
  (:require [clojure.string :as str]))

(def space
  ["...#......"
   ".......#.."
   "#........."
   ".........."
   "......#..."
   ".#........"
   ".........#"
   ".........."
   ".......#.."
   "#...#....."])

;; list of rows that are empty
(def y->sz
  (->> space
       (map-indexed (fn [i l] [i (if (= (set l) #{\.}) 2 1)]))
       (into {})))

;; list of colmuns that are empty
(def x->sz
  (->> space
       (apply map vector)
       (map-indexed (fn [i l] [i (if (= (set l) #{\.}) 2 1)]))
       (into {})))

(def galaxies
  (keep identity
        (for [[y r] (map-indexed vector space)
              [x c] (map-indexed vector r)]
          (when (= c \#)
            [x y]))))

(defn dist [[x1 y1] [x2 y2]]
  (reduce + (concat (map x->sz (range (min x1 x2) (max x1 x2)))
                    (map y->sz (range (min y1 y2) (max y1 y2))))))

(reduce + (for [g1 galaxies
                g2 galaxies]
            (if (< (compare g1 g2) 0)
              (dist g1 g2)
              0)))
;; => 374
