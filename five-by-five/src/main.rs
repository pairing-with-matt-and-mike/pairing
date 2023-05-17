#![feature(test)]

extern crate test;

use std::fs::File;
use std::io::{ self, BufRead };
use std::collections::{ HashSet };

fn main() {
    let words = read_words().unwrap();
    let answers = run::<LettersInt>(words);

    for answer in answers {
        println!("{:?}", answer);
    }
}

fn run<L: Letters>(
    all_words: Vec<String>
) -> Box<dyn Iterator<Item=Vec<String>>> {
    let dictionary = all_words
        .into_iter()
        .filter(|w|
                w.len() == 5 &&
                HashSet::<char>::from_iter(w.chars()).len() == 5
        )
        .collect::<Vec<_>>();

    find_answers::<L>(vec![], &dictionary)
}

fn find_answers<L: Letters>(
    words: Vec<String>,
    dictionary: &[String],
) -> Box<dyn Iterator<Item=Vec<String>>> {
    if words.len() == 5 {
        Box::from(std::iter::once(words))
    } else {
        let ws = find_possible_next_words::<L>(&words, dictionary);
        let ws2: Vec<_> = ws.to_vec();
        Box::from(ws.into_iter().enumerate().flat_map(move |(i, w)| {
            if words.len() == 0 && i % 100 == 0 {
                println!("{}/{} {}", i, ws2.len(), w);
            }
            let mut a = words.clone();
            a.push(w.clone());
            find_answers::<L>(a, &ws2[i + 1..])
        }))
    }
}

trait Letters {
    fn new(words: &[String]) -> Self;
    fn contains(&self, letter: char) -> bool;
}

struct LettersString {
    string: String,
}

impl Letters for LettersString {
    fn new(words: &[String]) -> Self {
        Self { string: words.join("") }
    }

    fn contains(&self, letter: char) -> bool {
        self.string.contains(letter)
    }
}

struct LettersSet {
    characters: HashSet<char>,
}

impl Letters for LettersSet {
    fn new(words: &[String]) -> Self {
        Self { characters: words.iter().flat_map(|w| w.chars()).collect() }
    }

    fn contains(&self, letter: char) -> bool {
        self.characters.contains(&letter)
    }
}

struct LettersInt {
    characters: u32,
}

impl Letters for LettersInt {
    fn new(words: &[String]) -> Self {
        let mut cs = 0u32;
        for word in words {
            for c in word.chars() {
                cs |= 1 << (c as u32 - 'a' as u32);
            }
        }

        Self {
            characters: cs
        }
    }

    fn contains(&self, letter: char) -> bool {
        let i = 1 << (letter as u32 - 'a' as u32);
        self.characters & i == i
    }
}

fn find_possible_next_words<L: Letters>(
    words: &[String],
    dictionary: &[String],
) -> Vec<String> {
    let invalid_letters = L::new(words);
    dictionary.iter()
        .filter(|dictionary_word|
                dictionary_word.chars().all(|c| !invalid_letters.contains(c))
        )
        .cloned()
        .collect()
}

fn read_words() -> Result<Vec<String>, std::io::Error> {
    let file = File::open("wordle-words.txt")?;
    io::BufReader::new(file).lines().collect()
}

const TEST_SIZE: usize = 1000;

#[bench]
fn letter_string(bencher: &mut test::Bencher) {
    bencher.iter(|| {
        let words = read_words().unwrap();
        let words = words.into_iter().take(TEST_SIZE).collect();
        let _: Vec<_> = run::<LettersString>(words).collect();
    })
}

#[bench]
fn letter_set(bencher: &mut test::Bencher) {
    bencher.iter(|| {
        let words = read_words().unwrap();
        let words = words.into_iter().take(TEST_SIZE).collect();
        let _: Vec<_> = run::<LettersSet>(words).collect();
    })
}

#[bench]
fn letter_int(bencher: &mut test::Bencher) {
    bencher.iter(|| {
        let words = read_words().unwrap();
        let words = words.into_iter().take(TEST_SIZE).collect();
        let _: Vec<_> = run::<LettersInt>(words).collect();
    })
}
