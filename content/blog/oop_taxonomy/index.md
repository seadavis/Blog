---
title: Object Oriented Taxonomy
date: "2022-03-06"
description: "Object Orientation and taxonomies"
---

# Introduction

After my third year of college I tried Haskell, and it was a beautiful experience. I fell in love with functional languages, especially when compared to object oriented counterparts like Python or Java. However for years I was unable to state why I preferred functional programming over object oriented. Was it the type system? Was it statelessnesses? Then a few weeks ago I saw this <a href="https://medium.com/machine-words/the-rise-and-fall-of-object-oriented-programming-d67078f970e2">medium post</a>.

That got me thinking, maybe the difference is in how object orientation encourages programmers to write simulations of the real world instead of computations to complete tasks. The problem with this attitude can be illustrated with an anecdote. A few years ok when I was writing software for directional drillers, I realized I needed more domain knowledge. I approached a directional drilling co-ordinator. I told him, I needed to know everything a DD does in an afternoon. He was understandably insulted. It is insulting to think a programmer could learn, and know more than SME's about their own domain. Especially if said SME's spent years in that domain.

The problem isn't inherent to object oriented programming. Indeed, over the years I have come to love object oriented programming. However, when executed naively object oriented programming leads us down a path of becoming taxonomists. Whereas we are computational experts.
 Therefore we should design object oriented programs such that, the domain data are simple value objects and then write processors
that compute values from the domain objects. Thereby allowing developers to focus their efforts on computation.

## App Example and Taxonomies

To further explore how object oriented programming encourages programmers to become taxonomists I will use the example from this <a href="https://www.educative.io/blog/object-oriented-programming">tutorial.</a>

Suppose we're developing an app called Pet Park. Pet park will have the following features:
- keep track of the dogs attendance
- get what area the dog should stay in while at the park.

Naive Object Oriented programming is illustrated with the following C#

The implementation for the Dog class
```csharp
public class Dog
{

    private int attendance;

    public void UpdateAttendance()
    {
        attendance++;
    }

    public virtual Area GetArea()
    {
        return Area.OtherDogArea;
    }

    public virtual void Bark()
    {
        Console.WriteLine("Woof!");
    }

}
```

And the two classes that inherit from it, Herding and Tracking


```csharp
public class HerdingDog : Dog
{

    public virtual Area GetKennel()
    {
        return Area.HerdingDogArea;
    }

    public override void Bark()
    {
        Console.WriteLine("Woof!");
    }

}

public class TrackingDog : Dog
{

    public override Area GetArea()
    {
        return Area.TrackingDogArea;
    }

}

```

In this particular implmentation of Pet Park I chose to seperate Dogs by Tracking, and Herding and the base class captures everything else.  In order to make this difference well-defined we need to define what makes a herding dog and what makes a tracking dog. We then need to get into the difference between Herding and Tracking. Which leads to asking what is "Tracking" anyways? Now we are philosophizing. This is a lot of work when all we needed was something that kept track of attendance and locations of different dogs. It is not hard to see why sometimes our stakeholders become very annoyed with us.

But there are other issues with this implementation as well. What if the business decided to put tracking and herding dogs together. Then the programmers would need to either change their core libraries or duplicate some code. Even Bark, common to all dogs, has exceptions. I have met dogs, with their voice taken out.

We could take this to a bit of an extreme, but I have seen production systems implemented like this. Suppose we want a feature e-mail to owner, to be consistent with our design we should have a method called EmailOwner(), that would look like this;

```csharp
public virtual void EmailOwner()
{
    emailClient.Send()
}
```
Due to the method EmailOwner, the core library relies on an implementation of an email client which is likely a third party library. What if, the software engineers needed to update the version of their platform (in this case .NET), but the authors of the library never updated and the two version of the platform are incompatible. It is likely the whole system will be uncompilable.

Therefore this approach produces inflexible systems, annoys stakeholders, and the developers wasted time wondering what <i>is</i> tracking anyways?

## Functional Programming Approach

Now, consider the same program instead implemented in Haskell. You'll have to forgive some pseudocode, it's been a while since I've done Haskell and this post is written on a sunny sunday afternoon.

First the defintion of "Dog",

```haskell
data Dog = Dog {attendance :: Int, 
                can_herd :: Bool, 
                breed :: String,
                bark_sound :: String,
                can_track :: Bool }
```

Now, an implementation of get kennel
```Haskell
getKennel :: Dog -> Area
getKennel dog 
| dog.breed == 'GermanShepard' = Area.North,
| dog.breed == 'Dalmation' = Area.South
etc.
```

Or an implementation of bark
```Haskell
bark :: Dog -> String
bark dog = dog.bark_sound
```

Or an implementation of update attendance

```Haskell
updateAttendance :: Dog -> int
updateAttendance = dog.attenance + 1
```

Functional programming allows programmers to focus on the computation. The programmer didn't have to make any decisions about whether a dog is a "tracking" or a "herding" dog, or what tracking and herding mean. Instead we just treat dogs like data and let the business make those decisions in the UI. Also, Area can be calculated by attributes on the Dog and not hardcoded in the method. If we need to put in e-mail, or text we just need a new function. These can exist in seperate libraries, meaning if either of the e-mail or sms client goes out of date, in the absolute worst case we just need to exclude those libraries from compilation. Furthermore we have allowed for mixed breeds since a dog can both herd and track. Therefore the system has a lot more flexibility and the developers didn't waste time arguing over whether or not a dog can track or herd.

Unfortunately though there are problems with this. The Haskell ecosystem is definitely lacking in terms of infrastructure. Things like database libraries and REST libraries etc. This is a problem if you're trying to write a REST API. So, back to C# we go. But this time with a fresh perspective.

## Better Object Oriented Approach

Having seen the functional approach we can now design a much better object oriented approach, to take advantage of the .NET ecosystem.

The basic idea here will be to use a Dog struct instead of a class so that Dogs are pure data, defined for us by subject matter experts. Then the actual work will be done by different processors, each defined as a seperate class.


Dog structure
```csharp
public struct Dog
{

    public bool CanHerd
    {
        get;
        set;
    }

    public bool CanTrack
    {
        get;
        set;
    }

    public int Attendance
    {
        get;
        set;
    }

    public Owner Owner
    {
        get;
        set;
    }

}
```


And for good measure we'll introduce the "Owner"
```csharp

public struct Owner
{
    public string FirstName
    {
        get;
        set;
    }

    public string Email
    {
        get;
        set;
    }

    public string PhoneNumber
    {
        get;
        set;
    }
}
```

Attendance Processor
```csharp
public class AttendanceProcessor
{

    public void UpdateAttendance(Dog d)
    {
        d.Attendance = d.Attendance + 1;
        UpdateDatabase(d.Attendance);
        return d;
    }

}
```

Assigning an area;
```csharp
public class AreaProcessor
{

    Dictionary<string, Area> areaLookup = new Dictionary<string, Area>();

    public Area AssignArea(Dog d)
    {
        return areaLookup[d.Breed];
    }

}
```

Or to e-mail an owner;
```csharp
public class EmailProcessor
{

    public void SendEmail(Dog d)
    {
        e-mailClient.Send(d.Owner.e-mail);
    }

}
```

Now to show off the flexibility of this approach we'll add texting an owner;
```csharp
public class TextProcessor
{

    public void TextOwner(Dog d)
    {
        SMSClient.Send(d.Owner.PhoneNumber, "Your Dog barks!");
    }

}
```

And change the attendance to broadcast the update
```csharp
public void UpdateAttendance(Dog d)
{
    d.Attendance = d.Attendance + 1;
    UpdateDatabase(d.Attendance);
    BroadCastAttendance(d.Attendance);
    return d;
}
```

And extend texting to Hamsters, by insisting Dogs take an interface IOwned and then Hamsters can implement the same interface like so;

```csharp

public interface IOwned
{
    Owner owner {get; }
}

public class TextProcessor
{

    public void TextOwner(IOwned pet)
    {
        SMSClient.Send(pet.Owner.PhoneNumber, "You're Dog barks!");
    }

}
```

As you can see adding Texting support is now as easy as adding an entirely new class. Refactoring to handle multiple types of pets is just adding an interface, and methods like attendance can become arbitrarily complex without bloating the Dog class. We have more pieces, but it is clear what each piece is responsible for. Therefore we have achieved flexibility and much greater code cohesio. Furthermore because we pushed all the interesting pieces into the processors, developers will understand where their efforts and attention should be focussed on.

## Conclusion

Be wary of naively implementing object oriented systems. Instead let data be just data and focus the inheritance hierarchy on the components that actually compute. Your system will be far more flexible and you'll far less time will be wasted philosophizing.
