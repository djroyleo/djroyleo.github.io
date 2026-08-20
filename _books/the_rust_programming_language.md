---
layout: book-review
title: The Rust Programming Language
author: Steve Klabnik, Carol Nichols, and Chris Krycho, with contributions from the Rust Community
cover: assets/img/book_covers/rust_programming_language_cover.jpg
categories: programming rust-programming-language
tags: top-100
buy_link: https://doc.rust-lang.org/book/
date: 2026-08-17
started: 2026-08-17
finished: 2026-08-29
released: 2018
stars: 5
status: reading
# status options include:'abandoned,finished,interested,paused,queued,reading,reread'
---
My solution to the coding problem posed in section 4.4, Understanding Ownership: The Slice Type, page 123.

``` rust
use std::io;

fn main() {
    let mut s: String = String::new();

    io::stdin()
        .read_line()
        .expect("Cannot read line")
    
    let mut word: String = String::new();

    for s_n: char in s.chars() {
        if s_n != ' ' {
            word.push(ch: s_n)
        }
        else {
            break
        }
    }

    println!("{}", word)
}

```

My solution worked, but did not require the use of slices. The book-provided example which walked through the use of slices and how they fix null-pointer errors was illuminating.