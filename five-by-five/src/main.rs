use std::fs::File;
use std::io::{ self, BufRead };
use std::collections::{ HashSet };

fn main() {
    let dictionary = read_words().unwrap()
        .into_iter()
        .filter(|w|
                w.len() == 5 &&
                HashSet::<char>::from_iter(w.chars()).len() == 5
        )
        .collect::<Vec<_>>();

    for answer in find_answers(vec![], &dictionary) {
        println!("{:?}", answer);
    }
}

fn find_answers(
    words: Vec<String>,
    dictionary: &[String],
) -> Box<dyn Iterator<Item=Vec<String>>> {
    if words.len() == 5 {
        Box::from(std::iter::once(words))
    } else {
        let ws = find_possible_next_words(&words, dictionary);
        let ws2: Vec<_> = ws.to_vec();
        Box::from(ws.into_iter().enumerate().flat_map(move |(i, w)| {
            if words.len() == 0 && i % 100 == 0 {
                println!("{}/{} {}", i, ws2.len(), w);
            }
            let mut a = words.clone();
            a.push(w.clone());
            find_answers(a, &ws2[i + 1..])
        }))
    }
}

fn find_possible_next_words(
    words: &[String],
    dictionary: &[String],
) -> Vec<String> {
    let invalid_letters = words.join("");
    dictionary.iter()
        .filter(|dictionary_word|
                dictionary_word.chars().all(|c| !invalid_letters.contains(c))
        )
        .cloned()
        .collect()
}

fn read_words() -> Result<Vec<String>, std::io::Error> {
    let file = File::open("words_alpha.txt")?;
    io::BufReader::new(file).lines().collect()
}
