#![feature(test)]

extern crate test;

use std::fs::File;
use std::io::{ self, BufRead };
use std::collections::{ HashSet };

fn main() {
    let words = read_words().unwrap();
    let words: Vec<&str> = words.iter().map(|w| w.as_ref()).collect();
    let dictionary = make_dictionary(&words);
    let answers = run::<LettersInt>(&dictionary);

    for answer in answers {
        println!("{:?}", answer);
    }
}

fn make_dictionary<'a>(all_words: &'a [&'a str]) -> Vec<&'a str> {
    all_words
        .iter()
        .filter(|w|
                w.len() == 5 &&
                HashSet::<char>::from_iter(w.chars()).len() == 5
        )
        .map(|w| w.as_ref())
        .collect::<Vec<&str>>()
}

fn run<'a, L: Letters>(
    dictionary: &'a[&'a str]
) -> Box<dyn Iterator<Item=Vec<&'a str>> + 'a> {
    Box::new(find_answers::<L>(vec![], dictionary))
}

fn find_answers<'a, 'b, L: Letters>(
    words: Vec<&'a str>,
    dictionary: &'b [&'a str],
) -> Box<dyn Iterator<Item=Vec<&'a str>> + 'a> {
    if words.len() == 5 {
        Box::from(std::iter::once(words.into()))
    } else {
        let ws = find_possible_next_words::<L>(&words, dictionary);
        let ws2: Vec<_> = ws.to_vec();
        Box::from(ws.into_iter().enumerate().flat_map(move |(i, w)| {
            if words.len() == 0 && i % 100 == 0 {
                println!("{}/{} {}", i, ws2.len(), w);
            }
            let mut a: Vec<_> = words.to_vec();
            a.push(w);
            find_answers::<L>(a, &ws2[i + 1..])
        }))
    }
}

trait Letters {
    fn new(words: &[&str]) -> Self;
    fn contains(&self, letter: char) -> bool;
}

struct LettersString {
    string: String,
}

impl Letters for LettersString {
    fn new(words: &[&str]) -> Self {
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
    fn new(words: &[&str]) -> Self {
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
    fn new(words: &[&str]) -> Self {
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

fn find_possible_next_words<'a, L: Letters>(
    words: &[&'a str],
    dictionary: &[&'a str],
) -> Vec<&'a str> {
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

const TEST_SIZE: usize = 200;

#[bench]
fn letter_string(bencher: &mut test::Bencher) {
    bencher.iter(|| {
        let words = read_words().unwrap();
        let words: Vec<&str> = words.iter().map(|w| w.as_ref()).collect();
        let words: Vec<&str> = words.into_iter().take(TEST_SIZE).collect();
        let dictionary = make_dictionary(&words);
        let _: Vec<_> = run::<LettersString>(&dictionary).collect();
    })
}

#[bench]
fn letter_set(bencher: &mut test::Bencher) {
    bencher.iter(|| {
        let words = read_words().unwrap();
        let words: Vec<&str> = words.iter().map(|w| w.as_ref()).collect();
        let words: Vec<&str> = words.into_iter().take(TEST_SIZE).collect();
        let dictionary = make_dictionary(&words);
        let _: Vec<_> = run::<LettersSet>(&dictionary).collect();
    })
}

#[bench]
fn letter_int(bencher: &mut test::Bencher) {
    bencher.iter(|| {
        let words = read_words().unwrap();
        let words: Vec<&str> = words.iter().map(|w| w.as_ref()).collect();
        let words: Vec<&str> = words.into_iter().take(TEST_SIZE).collect();
        let dictionary = make_dictionary(&words);
        let _: Vec<_> = run::<LettersInt>(&dictionary).collect();
    })
}
