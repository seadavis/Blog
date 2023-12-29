---
title: Property Testing C# collections
date: "2021-01-31T22:12:03.284Z"
description: "How to use Property-Based Tests Effectively"
---


In this tutorial you'll learn how to run Property Based Testing with C# and 
NUnit. You can read more about the technique in: the pragmatic programmers.
<a href="https://www.amazon.ca/Pragmatic-Programmer-journey-mastery-Anniversary/dp/0135957052">Pragmatic Programmers</a>

# Context

Property based testing, as opposed to example-based testing, is where we 
define a set of of random data to be fed into the test instead of 
hand-crafting each example. Since we are not hand crafting the individual
test cases we cannot check for hard coded values, instead we check that for
all data certain class invariants remain true. 

For my toy example I am developing a calendar application. Like all calendar 
applications you can add tasks etc. The difference with my example is it 
mimics real world calendars in that it has pictures associated with each month.
The end goal is allowing users to upload and share their own pictures, creating
their own virtual calendars.

Here is an example on what a rough version of the interface will look like:
[![Watch the video](https://img.youtube.com/vi/wkSFX08UhBQ/0.jpg)](https://youtu.be/wkSFX08UhBQ)

For this post I will focus on how we represent the association between
months and images.

# Data Structures and Properties

The following code snippet, shows how I chose to represent Month Images. It has 
an image source for the url, a month a year and a date time object introduced to
easily compare between months.

```csharp

   /// <summary>
   /// Represents an image for
   /// a particular month
   /// </summary>
   public struct MonthImage
   {
      /// <summary>
      /// the source of the image for a month
      /// </summary>
      public string ImageSource
      {
         get;
         set;
      }

      public int Month
      {
         get;
         set;
      }

      public int Year
      {
         get;
         set;
      }

      public DateTime Date => new DateTime(this.Year, this.Month, 1);

      /// <summary>
      /// the description for the particular image
      /// </summary>
      public string Description
      {
         get;
         set;
      }

   }

```

The months are then represented in a Month Image collection defined like so,

```csharp
   /// <summary>
   /// the collection of images
   /// stored on a given calendar.
   /// </summary>
   public class MonthImageCollection
   {

      private DateTime _earliestDate;

      private List<MonthImage> _images = new List<MonthImage>();

      
      /// <summary>
      /// The earliest month in the collection so far
      /// </summary>
      public int MinMonth => this._earliestDate.Month;

      /// <summary>
      /// the earliest year in the collection so far
      /// </summary>
      public int MinYear => this._earliestDate.Year;

      public void AddImage(MonthImage img)
      {
       
         var alreadyExistingImageDate = this._images.FindIndex(i => i.Date == img.Date);
         if (alreadyExistingImageDate >= 0)
         {
            this._images.RemoveAt(alreadyExistingImageDate);
         }

         this._images.Add(img);

         if (this._images.Count > 0)
         {
            var orderedImages = this._images.OrderBy(i => i.Date);
            var earliestImage = orderedImages.FirstOrDefault();
            this._images = orderedImages.ToList();
            this._earliestDate = earliestImage.Date;
         }
       
      }

      /// <summary>
      /// 
      /// </summary>
      /// <param name="date"></param>
      /// <returns>The month image associated with the given date as long as it is after
      /// the earliest date on the collection. If it is before the earliest date
      /// on the collection returns null.</returns>
      public MonthImage? this[DateTime date]
      {
         get
         {
            var index = this._images.FindIndex(i => i.Date == date);
            if (index >= 0)
            {
               return this._images[index];
            }
            
            return null;
         }

      }

   }
```

There are two properties I am interested in for this example. 
 1. Does the minimum month and year,represent the smallest month and year present 
    in the collection?
 2. Does a date given to the custom indexer find the 
    correct image? 

# Test Setup

For Property Based Testing in C#, we will use FsCheck and FsCheck.NUnit,
both of which can be found on Nuget. If you are using XUnit, or another
testing framework you'll just need to find the appropriate FsCheck
extension on Nuget.

There is one gotcha I'd like to mention with the NUnit FsCheck extensions. For Visual Studio's test explorer to properly run the test you need at least
an empty setup section in your test class. See the example below.

```csharp 
      [SetUp]
      public void Setup()
      {

      }
```

# Writing the Tests

The basic idea for generating random test data for FsCheck is, FsCheck provides
some generators for primitives, then we can combine those with Linq statements
to define our own generators.

First to generate a MonthImage with random data for the properties we need to 
have a static class in our test project, in this case called MonthImageGenerator,
with two properties. 

One property called gen, defines the generator for our Month Images, and the 
other property wraps up the generator in an Arbitrary object so that
it can be used in the NUnit decorators.

Here is the MonthImageGenerator class:

```csharp
   public static class MonthImageGenerators
   {
      public static Gen<MonthImage> gen =
         from month in Gen.Choose(1, 12)
         from year in Gen.Choose(2019, 2023)
         from imageSource in Arb.Default.String().Generator
         from description in Arb.Default.String().Generator
         select new MonthImage()
         {
            Month = month,
            Year = year,
            ImageSource = imageSource,
            Description = description
         };

      public static Arbitrary<MonthImage> Generate() =>
         Arb.From(gen);

   }
```

For ImageSource and Description we are using just the 
default random string generators and for the month and year we are making use,
of Gen.Choose which generate a random number between the two arguments.

Now to define a test that checks that for any MonthImage object that month
and year properties match the month and year defined on the date.

```csharp
  [FsCheck.NUnit.Property(Arbitrary = new[] {typeof(MonthImageGenerators)})]
  public Property YearMatches(MonthImage img)
  {
      return (img.Date.Year == img.Year && img.Date.Month == img.Month)
              .ToProperty();
  }

```

Now to dissect what the above code snippet does. 
`[FsCheck.NUnit.Property(Arbitrary = new[] {typeof(MonthImageGenerators)})]`,
tells FsCheck to use the Generate() function defined in MonthImageGenerators
to feed the test random MonthImage structures.
The Property return type is required on all FsCheck tests, and the line
`(img.Date.Year == img.Year && img.Date.Month == img.Month).ToProperty();` 
converts a boolean to a Property that can be checked on test execution
by the FsCheck library.

# Testing Collections

Now that we know how to test basic objects, the question know is how do we 
generate random lists. To generate random lists we need to leverage the
MonthImage Generator we used last time with the method Gen.NonEmptyListOf, to
create the random data.

The collection generator:

```csharp
   public static class MonthImageCollectionGenerator
   {

      public static Gen<FSharpList<MonthImage>> gen =
         Gen.NonEmptyListOf(MonthImageGenerators.gen);


      public static Arbitrary<FSharpList<MonthImage>> Generate() =>
         Arb.From(gen);
   }
```

The test to check that the min date on the MonthImageCollection really is,
the min date.

```csharp

     [FsCheck.NUnit.Property(Arbitrary = new[] { typeof(MonthImageCollectionGenerator) })]
      public Property MinDate(FSharpList<MonthImage> randomImages)
      {
         var collection = new MonthImageCollection();
         foreach (MonthImage monthImage in randomImages)
         {
            collection.AddImage(monthImage);
         }

         var orderedImages = randomImages.OrderBy(m => m.Date);
         var smallestImage = orderedImages.First();

         return (collection.MinMonth == smallestImage.Month &&
                 collection.MinYear == smallestImage.Year).ToProperty();
      }

```


This section:

```csharp

var orderedImages = images.OrderBy(m => m.Date);
var smallestImage = orderedImages.First();

return (collection.MinMonth == smallestImage.Month &&
        collection.MinYear == smallestImage.Year).ToProperty();
```

Finds the smallest date on the generated collection, and checks that it matches
the smallest date on the MonthImageCollection structure.

Now, for my last example I'll check that the indexer of dates on the 
Month Image collection gives back the proper image.

The idea of this test is to generate a random list such that
each month appears in the list only once and add it to the collection. We then
grab each image from the randomly generated list, and use it's date to get
the image from the collection. Finally we check

```csharp
[ [FsCheck.NUnit.Property(Arbitrary = new[] { typeof(MonthImageCollectionGenerator) })]
      public Property ImageOrder(FSharpList<MonthImage> randomImages)
      {

         var images = randomImages.Distinct().ToArray();
                                 
         var collection = new MonthImageCollection();
         foreach (MonthImage monthImage in images)
         {
            collection.AddImage(monthImage);
         }

        
         bool[] imagesAreEqual = new bool[images.Count()];

         for (int i = 0; i < imagesAreEqual.Length; i++)
         {
            var currentImage = images[i];
            var collectionImage = collection[currentImage.Date];
            imagesAreEqual[i] = currentImage.Date == collectionImage.Date;
         }

         return (imagesAreEqual.All(b => b == true)).ToProperty();
      }


```


The boolean array:
`bool[] imagesAreEqual = new bool[orderedImages.Length];` lets us write a simple
linq query that returns a boolean and therefore can be turned
into a property checkable by FsCheck, that all Images match the given dates.

# Summary

And that's all there is to it. I hope this has been enlightening enough so that
you can start writing property based tests in your own software projects.


