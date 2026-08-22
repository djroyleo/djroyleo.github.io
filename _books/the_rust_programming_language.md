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

I can't recommend this book enough to those who want to learn Rust and who have little programming/computer-science experience. It's very well written in a comfortingly _human_ way (something thats sorely lacking now-a-days), and the extensive example and counter-examples will leave you feeling like you can deal with any situation that comes across your path no worse than the most experienced Rustaceans.

# Chapter 1



# Chapter 2



# Chapter 3



# Chapter 4
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

# Chapter 5



# Chapter 6



# Chapter 7