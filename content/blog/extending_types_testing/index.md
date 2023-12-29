---
title: Extending Type Systems With Tests
date: "2021-09-04"
description: "A proposal on using programs to write tests"
---

In this post, I will describe a method for extending type systems with pre-existing
existing programming languages and testing frameworks.


## Introduction

Our current methods of testing software are inadequate. As Microsoft MVP Billy Hollis points out
in this  <a href="https://www.youtube.com/watch?v=9TqlbXCLybg">video</a>, the complexity of software requirements is increasing all the time. However, our techniques
for producing software have become stagnant.
Unit testing has been around for a long time, and has gotten a lot better over the years. However it is still the same fundamental technique; manually craft each test case, and then run them all
on every commit.
Other techniques such as formal verification have come a long way, with the addition of frameworks like Agda, Coq and Liquid Haskell.
However formally verification has yet to reach ubiquity, due to complexity of the tools and the difficulty of proving the proof. I propose
combining the two approaches, effectively extending your type system with tests. Allowing us to adopt the technique that programmers know and love,
to allow the techniques we have of creating software keep pace with the rate at which the complexity of requirements is increasing.


## Problems with Unit Tests

Tests in software are very important, they allow us to build software people love to use and makes the internals of our software very flexible. 
As a software developer points out in this <a href="https://changelog.com/founderstalk/74">podcast</a>, the reason why his software development
firm was so well respected was their superior testing practices.  In the podcast Corecursive, Dr. Richard Hipp, the inventor of SQLite talks about how having 
an aggressive test suite allows him and his team to rip out and rewrite entire sections of the codebase (link to the episode <a href="https://corecursive.com/066-sqlite-with-richard-hipp/">here</a>). Without those tests, the
risks would simply be too high, as SQLite is one of the mostly widely deployed databases in the world and is relied on by many safety critical applications. Unit testing is so important that programming languages like Deno and Go, have unit testing built in. Yet, unit testing is still very hard to do. There is at least one <a href="https://changelog.com/gotime/185">podcast</a>,
and an <a href="https://pragprog.com/titles/utj2/pragmatic-unit-testing-in-java-8-with-junit/">entire book</a>, dedicated to teaching developers how to utilize such a technique. Furthermore, frameworks like
<a href="https://github.com/AutoFixture/AutoFixture">AutoFixture</a> have been developed to make unit testing easier. If it were easy, books, podcasts and frameworks would be unneccessary.

Why is unit testing so difficult? Unit tests suffer from a serious maintenance problem. In <a href="https://pragprog.com/titles/utj2/pragmatic-unit-testing-in-java-8-with-junit/">Pragmatic Unit Testing</a>, the pragmatic programmers suggest that your testing code should be just as large as your 
actual code base. I believe this to be good advice, however when your code base changes the unit tests also need to change so with Unit Tests you have twice the maintenance. Furthermore needing to manually
specify each case can be tedious. Even a function with just three boolean arguments, would take 8 seperate tests to fully check. And I don't know about you, but I have never written program that has only one function, and that function only took in three booleans. I have encountered a few software engineers who lamented that their bosses wouldn't let them write tests, since it
"takes too long". While I don't agree with this sentiment I can certainly understand why some managers have difficulty explaining to executives why their engineers spend half their day writing test code.  

## Other Correctness Approaches

Another attempt to make software safer, has been the development of formal verification techniques. With these approaches a proof assistant helps to prove (in the same sense Euclid proved theorems) your software is correct. This has been done with Coq, Agda and Liquid Haskell. This approach, largely enabled by theorem provers like Z3, has come a long ways in the past few years. So good, that we can start to prove the correctness of <a href="https://compcert.org/">compilers</a>. However I doubt this approach
will ever be used by mainstream programmers. First, all rely on some pretty sophisticated mathematics, beyond what is taught in a typical CS curriculum, and way beyond what is taught in Bootcamps. Second, in some cases proving the correctness is just as hard and complicated as just writing the damn function. In the paper <a href="http://www.cse.chalmers.se/~peterd/papers/DependentTypesAtWork.pdf">Dependent Types At Work</a>, on page 31, the authors give an example of a binary tree proved correct with Agda. The proof of correctness is equally as hard to write as the code was. How then, do we know that the proof is correct? Unit tests mitigate this issue, by insisting on being so simple that they are correct by inspection.

Another approach to testing can be seen with, Property-Based Testing. In Property-Based Testing we write a system that generates random inputs and then write tests that test general properties of the software under test. A good example on how to use
Property-Based Testing is with serialization.

Consider the test function;

```csharp

public void TestSerialization(SomeDataType t)
{
    var serialization = JsonConver.SerializeObject(t);
    var deserialized = JsonConvert.DeserializeObject<SomeDataType>(serialization);
    Assert.AreEqual(t, deserialized)
}

```

In the above function the property we are testing is deserialization undoes serialization. Property-Based Testing frameworks would then generate random data on the variables of SomeDataType,
and pass it into the above testing function. Before moving on, I will say this about Property-Based Tests; it is a very difficult skill to learn how to write Property-Based Tests and the properties take 
much longer to write than a unit test, but it is worth the effort. In the end you end up with software with a high level of correctness confidence.
 
## A hybrid approach to correctness

Formally proving software correctness, is very accurate but very difficult to learn. Unit testing is much easier to learn but, since we have to spell out each case manually, it is easy to miss a case or write a test that is testing the wrong conditions. To strike a better balance between the difficulty of using the framework, and the difficulty in spelling out all the cases, I suggest we use unit tests and property tests to test the lowest levels of the software, yielding correctness axioms. Then write Property-Based Tests
for the pieces higher in the tech stack, but instead of running random inputs through the property tests, use a theorem prover to prove that the underlying software matches the tests.

I'll illustrate with a few examples. 

We can write a function that tests sorting as follows:

``` csharp


public void TestSort(int[] values, int index1, int index1)
{
    var sortedValues = Sort(values);
    Assert.AreEqual(values[index1] < values[index2])
}

```

As long as we specify that index1 is less than index2, we have an axiom for Sort that theorem provers can take for granted. In other words, Sort may not be proved correct, but with unit tests we can assume the function is "correct enough", and software higher in the stack <i>can</i> be proved correct.

An example of a function that uses sort is Max,

``` csharp

public void Max(int[] values){
    var sortedValues = Sort(values);
    return sortedValues.Last();
}

```

We can specify the correctness of Max as follows:

``` csharp

public void TestMax(int[] values, int index1)
{
    var max = Max(values)
    Assert.AreEqual(values[index1]  <= max)
}

```

The assert statement becomes the target for a theorem prover like Z3. And we can prove the assertion statement, assuming the correctness of sort. This is left as an excercise for the reader.

For a more complex example; suppose we want to test that an API applies some function to the input, and then serializes the outcome.  Further suppose that serialization has been tested as illustrated in the Property-Based Tests section of this post.
Instead of testing the API, we can write a function that looks like the test but specifies what it means for the API to be correct. 

Here is what such a function would look like:

``` csharp

public void TestAPI(SomeData value)
{
    var apiResult = API(value);
    var fApplied = FunctionToApply(value);
    var deserializedResult = JsonConvert.Deserialize<SomeData>(apiResult)
    Assert.AreEqual(apiResult, deserializedResult);
}

```

## Corollaries

Before I end, I'd like to point out some consequences of extending your type system in this way.

- We can specify the set of correctness conditions for some interface then reuse the tests across any classes implementing the interface
making it simple to replace whole sections of the code.

- Since the tests that are not proven are at the bottommost layers, we can apply symbolic techniques, as <a href="https://crosshair.readthedocs.io/en/latest/introduction.html">crosshair</a> does to try and break
the unit tests, without specifying each case. If the tests were too high in the stack this would be intractable.

- We can build a programming language that doesn't even compile if conditions are not specified or if a test is broken.
If something can't be tested, for example configuration we can mark it as 'unsafe'. Then unsafe code, can mix with
unsafe code. But to be used with safe code it needs to be tested.

- Now we can also build in a set of "axioms", for types like integers. And inject our own types into all functions accepting integers as long as the "axioms" are met.
Gaining some of the advantages of dynamic languages, like being able to have a symbolic execution engine without needing to rewrite the compiler. See the python project
<a href="https://crosshair.readthedocs.io/en/latest/introduction.html">crosshair</a> for details.
