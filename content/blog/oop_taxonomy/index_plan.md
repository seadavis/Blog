---
title: Object Oriented Taxonomy
date: "2021-04-03"
description: "Problem with object oriented programming"
---

## Thesis

If done Naively Object Oriented Programming leads us down a path of becoming taxonomists. When what we are is computational experts, not
philosophers. Nor are we experts in a domain, and it is a little insulting to domain experts to suggest that in a few moments we can
become experts in their area. If we rely on domain experts to help us build the taxonomy then, we end up with an inflexible system since 
the classification is central to how our code is organized.
 Therefore we should design object oriented programs such that, data are simple definitions and processors 
exist that computer over top of them, thereby allowing us to spend our time in computation and allowing flexibility to rapidly respond to business
changes.

# Introduction

Use the two links to introduce saying these two got you thinking. about taxonomy

Use the anecdoate about Matt to say argue that domain experts are often insulted
that we think we can become experts in the area.

Then state your thesis statementm, the part about being insulting.

Then state the flexibility portion.

## Pre-I Introduce the concept for the app
Give credit to Counter Example (dogs). Call it Pet Park.

An app for keeping track of dogs in a dog school.
- Give the dogs food
- keep track of the dogs attendance
- get what kennel the dogs belong to. Saying Tracking and Herding get different food and they get different areas of the pet park.

## I Thesis
Object oriented Programming forces us to become taxonomists.

Taxonomy is the classification of organisms. Take for example the dog program. Dogs , herding dos and tracking dogs. First what seperates herding
v.s. tracking. In order to classify we need to define the difference. When all we needed was something that kept track of attendance of different dogs.

"Puppy" v.s. Dog may be treated differently. But even that could only be temporary,

Even Bark, common to all dogs, unless they have their voice taken out. 

Update attendance in C#. Get the area the dogs belong to.

Futhermore we need a definition of age. What if some users want one, and some more users want another.

Furthermore, what about mixed breeds.

or, what if the business decided to unify tracking and herding dogs and treat them same. The change to account for this would be huge.

Taken to an extreme (admit this) email to owner now has your core library rely on email. What if that email client goes out of date?

## II Thesis
Functional programming allows us to focus on the computation.

By "Focus on the computation" I mean no decision points about whether a dog is a "tracking" or a "herding" dog.

Give the example of updating attendance in Haskell such that:
- we don't use classes except for maybe an interface.
- use composition to update the database.
- use composition to update attendance for other classes such as hamsters.


## II Thesis
To use Object Oriented Programming in a far more flexible fashion to keep up to date with business changes we can instead use another way.

- Define an attendance processor. And Dogs and hamsters under IAttendable
- Use bark as the Barker
- we can also now just use food across the hierarchy. And one method called GiveFood() that implements an interface.
- we can also tack on email owner in a seperate microservice that doesn't know about Owner.

We can then user HamsterFoodProcessor : FoodProcessor to take into account "differential programming"



## Links
<A href="https://medium.com/machine-words/the-rise-and-fall-of-object-oriented-programming-d67078f970e2">Taxonomy Post</a>
<A href="https://towardsdatascience.com/imagining-the-world-in-terms-of-classes-and-objects-fe04833a788c">More ammo for "taxonomy"</a>
<a href="https://www.educative.io/blog/object-oriented-programming">Counter Example (dogs)</a>
