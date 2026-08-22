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

## Chapter 4.4

My solution to the coding problem posed in chapter 4.4, _Understanding Ownership: The Slice Type_, on page 123.

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

## Chapter 7.3

Take a look at listing 7-9 in chapter 7.3, _Paths for Referring to an Item in the Module Tree: Making Structs and Enums Public_, on page 200.

```rust
mod back_of_house {
    pub struct Breakfast {
        pub toast: String,
        seasonal_fruit: String,
    }

    impl Breakfast {
        pub fn summer(toast: &str) -> Breakfast {
            Breakfast {
                toast: String::from(toast),
                seasonal_fruit: String::from("peaches"),
            }
        }
    }
}

pub fn eat_at_restaurant() {
    // Order a breakfast in the summer with Rye toast.
    let mut meal = back_of_house::Breakfast::summer("Rye");
    // Change our mind about what bread we'd like.
    meal.toast = String::from("Wheat");
    println!("I'd like {} toast please", meal.toast);
}
```

This tripped me up at first because I thought that the `pub` keyword before the field definition of `toast` during the definition of the `Breakfast` struct was "bypassing" the natural immutability of the `toast` field (I wanted toast to be defined as `pub mut toast: String,` even though this is not valid Rust syntax for defining struct fields). What I failed to understand is that struct fields do not have natural immutability themselves, and that the license to mutate _actually_ comes from the **binding** which in this case is the variable binding `let mut meal = back_of_house::Breakfast::summer("Rye");`. Here meal is bound--_using the mut keyword_--to an expression that evaluates to an instance of the Breakfast struct, therefore allowing mutability on this instance of the Breakfast struct and all associated fields.