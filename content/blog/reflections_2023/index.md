---
title: Five Lessons 2023
date: "2023-12-29"
description: "Things I learned in 2023"
---

## Introduction

Last year I didn't have a lot of time to post on this blog, but I did go through a sort of cocooning period. A period
of personal growth in my own little shell away from everything else. So, I thought this would be a good time to post five valuvable lessons I learned this year 
in my time of radio silence. These ideas are incomplete and sketchy on purpose.

## Lesson 1: 37 Signals' Shapeup == Scrum

37 Signals call their process <a href="https://basecamp.com/shapeup">"Shapeup"</a>. Let's see if we've heard of anything like it before. 

- A process that shifts responsibility of what to build in the hands of the team building.
- Doing things in finite cycles of time so that the team doesn't do the wrong thing for a long time.
- Having a defined process that eliminates the need for ad-hoc meetings.
- Sticking to a bounded time context so that <i>something</i> gets out and validated against use cases in the field.

To me this sounds like a pitch for Scrum. 

Under Shapeup backlog grooming exists in the form of "betting". Refinements are called "shaping". Planning and retros are referred to as the betting table. Work must fit the cycle and if the work is not done, then it goes back to the betting table. A small development team acts with complete autonomy <i>and</i> responsibility. The person in charge of the betting table can be mapped to a PO in Scrum.

There are a few difference but I think those are minor.

One difference is that cycles are six weeks instead of three. However three weeks really is a strange vestiage of older Scrum definitions that I think have been overlooked when the Scrum guide has gone through updates. Over the years Scrum has become less and less prescriptive. For example roles were removed from the scrum guide in favour of accountabilities. With that in mind I think the Scrum guide should be updated to say something like "a sprint length should be shorter than one financial quarter". That's the importnat part, the three weeks feels arbitrary, but being able to shift priorities means it needs to be less than a financial quarter so that other parts of the business can plan in response to software.

Another difference is the lack of standups. But the whole point of standups is transparency, most of that is covered in the chapter <a href="https://basecamp.com/shapeup/3.4-chapter-13#nobody-says-i-dont-know">Show Progress</a>. I think if Scrum were written with today's remote world in mind we'd probably come a lot closer to something like Shapeup instead of daily standups.

I view shape up as a good companion to scrum and some good techniques for doing scrum well.

## Lesson 2: Unit Testing is for Collaboration not Correctness

As Joe Albahari points out in <a href="https://www.youtube.com/watch?v=WdZXrzuTxic&t=30m19s">this video</a> Unit testing is pretty inefficient. When I first heard this idea it always kind of stuck with me  then I started hearing it in other contexts as well. For a long time I took issue with the notion that unit tests might not be all that valuable. Then I realized another way to say the same thing; Automated testing checks if software behaves the same way after a change to the code is made. As a corollary to this; we don't need a lot of unit tests when developing on a small scale project because we don't have a lot of pieces that are written independently, therefore we don't need a lot of contracts to define what each component should do. 

For example suppose we have three cases for some acceptance criteria in a user story:
1) Throw an exception if the file already exists.
2) Throw an exception if the user inputs a string that is not in the form yyyy-mm-dd2
3) Write to the database if the file doesn't exists and the string is in the form yyyy-mm-dd

As long as each person writes unit tests for each case we can chop this problem into three different problems given to three different people. This is especially valuable if 
you are forced to work in a 2 week sprint, which for a complex product can be challenging.

I hear the objections now. "Wait aren't there going to be merge conflicts!?" Yes, but there are unit tests for each case, and as I stated before automated tests check that the behaviour doesn't change if the code changes. Therefore as long as the tests each person wrote is brought into the final production version of the code the merges should be simple to verify; just run the tests.

Therefore I think a unit tests greatest strength is not in checking correctness but is in verifying that after changes made by someone who is not you the software behaves in the
same way that you intended.

## Lesson 4: Instead of thinking about Testing Taxonomies, I prefer to think about what properties I want my test to have.

In today's world there are a myriad of testing techniques; fuzz, integrated
unit, functional, acceptance, user, snapshot ... the list goes on. Each of these techniques form a sort of "testing taxonomy". A way
to categorize the tests by their type. I think this taxonomy actively harms software development as it leads to debates into what is a "unit" or is this
an acceptance or a functional test, which is a contentious and silly debate. Moreover sticking to this taxonomy in a strict sense means that in a "unit test" you can't write to the filesystem or the database and in an "integration" test you can't mock, even if beneficial to the test.

Instead we should focus on the properties we need a test to have to ensure it's a value add and not a pain in the ass;

How easy is this test to maintain?
How long does this test take to run?
Do we know every bit of behaviour before writing the test?

Is this a test we need to ensure a base level of functionality is there?
Are we writing this test to enable collaboration but once the pieces are written we don't need them anymore?

Are we writing this test to be extra thorough?
Are we writing this test so that we can verify performance?

How likely is it that this piece breaks?

Let's run through a few examplew to see what I mean.

### Example 1: Collaboration
Maybe you are collaborating with a large group of people, but the other pieces aren't there then you might want to write a unit test to ensure your component meets it's contract and mocks might be necessary to do that. Even if you did go this route I think a good practice would be to make a task in Jira or Devops to replace the mocks with real components as they are done and throw away tests that are just repeats of each other. This has the added benefit of ensuring that the pieces work together before shipping to QA.

### Example 2: Exception Tests
Maybe there is a test that needs to check that no matter what exceptions the sub pieces throw it logs the error but continues, well then 
there is a need to mock a component and throw up an error as forcing your file system or a database into an error can be really expensive. But mocking every component is very expensive in terms
of both run time and maintenance so you might want to not use a mock for every other component.

### Example 3: Physical Device Protocols
Maybe you're writing a component to work with a protocol for a physical device, in that case writing a mock makes a lot of sense, as that device might be difficult to obtain but creating a mock for a component that writes to the local file system has zero value. However there is quite a bit of value in working with the actual file sytem of a real computer.

### Example 4: Legacy Applications
Maybe you have a legacy application with all of the logic in SQL on the databse and you want to use an ORM instead. To accomplish that I'd write snapshot integration tests using something like <a href="https://github.com/VerifyTests/Verify">Verify</a>.

### Example 5: Mathematical Functions
Maybe you need to check that some complicated math works according to some well known values. In that case verifying the individual component in a "unit" test provides quite a bit of value.

## Lesson 4: Git can be a really effective tool

Mastering git and related source control tools can be a source of great strength. 

Things I've used git for:
- trying out different ideas then merging them back together.
- keeping track of experiments
- going back in time after messing up royally.
- finding which change broke the source code.
- making a small change PR'ing it then branching so that I can move on while waiting for comments from reviewers.

I've improved a lot as a software developer and learning git well is a big part of why.

## Lesson 5: People think Scum/Agile is new!? WTF?

Technically this is an observation, but I think I'm safe from the blog police.

I took two scrum courses this year and while I thought they were both great and I learned a ton 
about where my understanding of Scrum could be improved I was shocked when I heard "agile transformation" or "this is a great new way of doing things", or "waterfall is the old way and Scrum is the new way". I've heard these things in both Scrum courses and today I hear developers touting Scrum as a good alternative to what "everyone else does". 
Whenever I hear these things my mind flashes a big 'ol <b>WTF?!</b>. Scrum is older than me, and I'm writing this blog.
I've never heard of anything other than Scrum. Never tried to do anything other than Scrum and no self respecting software development team
would even claim they were doing waterfall (although some do and call it Scrum).

Suggesting Scrum is a "new" management methodology and an alternative to what everyone else is doing is seriously fucked up and ridiculously out of touch. It's not new
and you'd be hard pressed to find a software leader who doesn't agree with the philosophy of Scrum. Even if they don't put that philosophy into practice very well.