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

# Chapter 10

## Chapter 10.1

Implementing methods on structs is an incredibly useful feature of Rust, and so is the type system and, by extension, the generic type system. Say you have a struct of generic type `<T>`, and you want to implement methods on this struct. However, you only want to certain method implementations to be available when your struct is of a particular type. For example consider this struct:

```rust
struct Point<T> {
    x: T,
    y: T,
}
```

This struct can realistically take x and y values that are i8, u8, i32, f64, and anything else. But say we want to have a method that works on a `Point` object only when it is of type `f32` and converts it to type `f64`. We don't want this method to work on `Point` objects with x and y values of type `u8` for example, so what's the syntax we can use to specify our demands? Take a look at the following code to see:

```rust
impl Point<f32> {
    fn f32_to_f64(&self) -> Point<f32> {
        // Write code here to convert Point<f32> to Point <f64> and return it.
    }
}
```

Alternatively the syntac to implement a method that works on generic types instead of concrete type is the following:

```rust
impl<T> Point<T> {
    fn x(&self) -> &T {
        &self.x
    }
}
```

## Chapter 10.2
Traits are used to defined *shared behavior* between different types. The behavior of a type, any type, is defined by the methods that can be called on that type. So *shared behavior*, in terms of types, really refers to *shared methods*. Traits, then, are a way of logically grouping shared methods across types, insuring that different types are guaranteed valid ways of handling a set of method calls if they share the same trait. We can see how traits work just by looking at the way we define traits in Rust code.

```rust
pub trait Summary {
	fn summarize(&self) -> String;
	fn summarize_to_char_vec(&self) -> Vec<Char>;
}
```
As we can see in the above example, a trait definition has within it various method signatures (`fn summarize(&self) -> String` and `fn summarize_to_char(&self) -> Vec<Char>`, in this case) telling us what methods types with this trait will implement, what the arguments to those methods will be, and what the return types to these methods will be. Importantly, though, the implementations of these methods (what goes in the curly brackets `{}` after the methods signature) does NOT occur in the trait definition, and instead will occur *later* during the unique and per-type implementation of the trait.
```rust
impl Summary for NewsArticle {
	fn summarize(&self) -> String {
		// Logic and expression which evaluates to a String which is a summary 
		// of type NewsArticle.
	}
	
	fn summarize_to_char(&self) -> Vec<Char> {
	// Logic and expression which evaluates to a vector of characters which is
	// a summary of type NewsArticle.
}
```
The following is a more expansive example of defining two separate types as structs and implementing a shared trait to both of them. This example comes from *The Rust Programming Language* book ("The Book"):
```rust
pub struct NewsArticle {  
	pub headline: String, 
	pub location: String, 
	pub author: String, 
	pub content: String, 
}

impl Summary for NewsArticle {  
	fn summarize(&self) -> String {  
		format!("{}, by {} ({})", self.headline, self.author, self.location) 
	} 
}

pub struct SocialPost {  
	pub username: String, 
	pub content: String, 
	pub reply: bool, 
	pub repost: bool, 
}

impl Summary for SocialPost {  
	fn summarize(&self) -> String {  
		format!("{}: {}", self.username, self.content) 
	} 
}
```
In addition to grouping families of methods on types, traits can be used in normal function definitions to limit the arguments passed to those functions. Say for example, we want to define a function that allows any type to be passed to it, as long as that type implement a certain trait. We can do that in Rust! Like so:
```rust
pub fn notify(item: &impl Summary) {
	println!("Breaking news! {}", item.summarize());
}
```
The above code was taken directly from *The Rust Programming Language* book, and describes a function that takes any type as an argument `item` as **long as that type implements the `Summary` trait**. In this case, the notify function can call all the methods associated with `Summary` on the `item` argument within its implementation. This is allowed because all the methods defined in the method signatures associated with types that implement the Summary trait are ***defined***, in this particular case meaning that we KNOW that `.summarize()` returns a `String` type. It cannot return anything else, it is how it is defined to be.

But what about when our function has two or more arguments? Well in these cases there are more options to cover. Specifically, we want to explicitly define whether the multiple arguments are allowed to be of the same type or not. If we want the function to take multiple arguments (two, for example) that can be different types and which both implement `Summary`, then the function signature should look like so:
```rust
pub fn notify(item1: &impl Summary, item2: &impl Summary) {
```
However if we want the function to take multiple arguments that cannot be different types and which both implement `Summary`, then the function signature should look like so:
```rust
pub fn notify<T: Summary>(item1: &T, item2: &T) {
```
In this case, the type signature in the `< >`  brackets as constrained the types of the `item1` and `item2` arguments to be a generic of type T that implements Summary, but also--importantly--the SAME generic of type T that implements Summary.