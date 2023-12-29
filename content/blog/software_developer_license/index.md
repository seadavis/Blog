---
title: Software Developer Licensing
date: "2021-04-03"
description: "What should a software developer license look like?"
---

In this post I will outline what core skills need to be tested for a hypothetical Software Developers license and give some examples
of what these questions could look like.

I have read some internet posts, and heard some people complain about coding tests in interviews. Often these developers will argue
that Doctors Lawyers and Accountants do not get quizzed on trivia about then tecnialities of their professions in interviews, so why should we? While I
do support the general idea of putting programming as a profession as the same level as Doctors, Lawyers and Accountants this argument forgets that
Doctors, Lawyers, and Accountants have licensing. There is an independent body that verifies, yes this person is capable of being in this profession. That independent body has an interest
in ensuring that people who pass their exams are competent in their jobs otherwise no one will take actually take their tests as it will not increase their chances of getting a job.
 
As we enter the middle of the 21<sup>st</sup> century businesses and lives depend on software functioning correctly. An incompetent software developer can prove
dangerous. Therefore, society needs some mechanism to check that those claiming to be software developers have the skills and the knowledge necessary to write software.
If we, as an industry, want to be done with coding tests, then we should support, and work towards licensing. 

## What Should a licensing exam look like?

Do we need to verify everyone who wants to write software, can write graph algorithms as found in the challenge section
of <a href="https://www.amazon.ca/Cracking-Coding-Interview-Programming-Questions/dp/0984782850">Cracking the Coding interview</a>? Write complicated SQL statements? Understand Javascript? UML diagrams? While these are excellent skills to have, 
there is either too much disagreement on their use for a license that spans an industry, while others are too dependent on specific technologies that are still undergoing rapid change and could be obsolete between the start and end of a persons career. 
Furthermore, any compentent developer should be able to switch between specific technologies. Finally, it has been rare in my career that I have had to worry about the intracies of Turing machines and Linear Algebra. As such, 
a Software Developer license should be independent of a specific bachelor degree, much like accounting and law. 

The three core competencies that are independent of technology, and attainable regardless of degree are:

1) Verifying Correctness of code
2) Handling and Creating Abstractions
3) Estimating Big-Oh complexity.

## Verify Correctness of Code

Perhaps the most important core skill of the Software Developer is the ability to verify a piece of code will work as intended. If a piece of code does not work, lives and potentially millions
of dollars will be lost. 

There are three components to ensuring that a potential developer can check code correctness. First, a Software Developer should be able to write unit tests. Whether or not, you believe in TDD, 
automated testing is a good idea, and is widely accepted. To see the acceptance of automated testing across the industry, you only need to see the high number of testing frameworks and 
that testing frameworks are getting more sophisticated such as in the cases of 
<a href="https://github.com/pschanely/CrossHair"> Cross Hair</a> and <a href="https://github.com/HypothesisWorks/hypothesis">Hypothesis</a>. A question for this skill in a licensing exam could be as simple as, 
defining an interface then asking the potential Software Developer to write unit tests that will verify an implementation of the interface is correct.

Second a competent Software Developer should be able to argue, at least informally that their code is correct. This test is important because it will help to 
weed out the developers who simply type in keystrokes almost at random hoping their algorithm will be correct. This test could be as simple as  asking the 
test taker to argue, at least informally that some algorithm given in pseudocode will or will not work.

Finally, any competent developer should be able to find a bug in someone elses code. We read code, much more than we write code (<a href="https://www.goodreads.com/quotes/835238-indeed-the-ratio-of-time-spent-reading-versus-writing-is">see this quote from Robert Martin</a>).  The test for the skill of bug finding in someone else's code is simple, get them to review some half-decent code
and point out potential problems, much like they would do in a formal code review. 
I have used this myself a few times when interviewing developers, and have found it to be fairly effective in finding solid programmers.

## Handling and Creating Abstractions

Abstraction is core to computing. File systems are a great example. There is no physical file, a 'file' can correspond to a block on a disc, multiple non-contigous blocks or even blocks
spread out amongst machines. File systems are an abstraction. Abstractions are so prevalent that at first I was going to say everything is an abstraction over a bit, but bits are  on
the bottom of the abstraction heap. The bit is an abstraction over an electric signal. It's turtles all the way down.

The tests for this skill need not be hard, and should only take a few minutes of a developers time to prove they can handle and create, abstractions.

To test a persons ability to handle abstraction, we need to find an example of abstraction that,
almost everyone with a highschool education should be familar with.  I've already mentioned such an abstraction; file systems. A licensing exam could include
a question to write a method, in pseudocode that searches for a file using recursion to go into subfolders arbitrarily deep. Fairly straightforward to handle the basic cases, other cases
like file corruption, and folders being linked need not be handled for this simple test.

One possible way to test for abstraction creating, is to ask the test taker to write an abstraction over a database. As an example; write an interface for a database that retrieves the message a User has
sent since a specific time. For which one possible answer is;

```csharp
  public interface IMessageFetcher
  {
    Message GetMessagesSince(int userId, DateTime? time);
  }
```

While taking a test a potential software developer, need not be concerned with what exactly a message is, or other messy edge cases which depend on the particular domain. All a license needs to check, is that they can abstract over a complex operation.

## Big-Oh Complexity

This one might seem odd at first glance since I said a license to program should be obtainable irregardless
of degree, yet Big-Oh complexity is not usually taught in high-school. However the core idea is fairly 
simple and does not require the learner to get bogged down in weird set-theoretic definitions or limits, the Big-Oh complexity is 
just an upper bound for the worst case. I'm not suggesting every developer be able to use the master method for recursion,
or be able to prove tight upper bounds, but we should be able to look at an algorithm and estimate how many comparison are done,
or how often it will have to make a round trip to the database.

Understanding and being able to describe an algorithms Big-Oh complexity is important because it is just so easy to 
write an algorithm that behaves in n<sup>3</sup> time, when it could be in n. In some cases it can be dangerous and in a lot of 
cases writing such an algorithm can be costly. The question for this understanding can be fairly simple; give the test taker
5-6 algorithms written in pseudo-code, and get them to tell you which algorithm is in n time, n<sup>2</sup> time 
and n<sup>3</sup> time. Bonus points if the test taker can estimate space complexity.

## Conclusion

There you have it. The three skills listed above should be fairly uncontroversial in testing a developers core skills, and are an
excellent first step towards licensing developers so that you never have to work with an embarassingly incompetent 
developer again. Even if these aren't used in licensing at the moment, they do form good core guidelines when
interviewing developers.
