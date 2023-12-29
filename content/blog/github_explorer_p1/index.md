---
title: Inverted U Series - Part I
date: "2021-10-04"
description: "Examining Number of lines of Test Code in Projects"
---

In this first post of the series on studying "inverted-u's" in software, I will describe how to grab the # of lines of code for a given project hosted on github.

## Introduction

In the book <a href="https://www.amazon.ca/dp/B00BAXFAOW/ref=dp-kindle-redirect?_encoding=UTF8&btkr=1">David and Goliath: Underdogs, Misfits, and the Art of Battling Giants</a>,
Malcolm Gladwell descibes the concept of "inverted-u's". Said concept is easiest to understand if we look at an example such as money (as Gladwell does in the aforementioned book). The amount of money a person has, increases happiness only to a point then there comes a time when an increase in money causes a decrease in happiness. After reading about this concept, I began to wonder where it might apply in software development. Is there a point at which the number of tests actually hurts software quality? I imagine the answer is yes; too many tests means that a small change reverberates throughout your testing code, taking what should have been simple change and turning it into a very complex one. 

To answer this question I decided to turn to the <a href="https://docs.github.com/en/rest">Git Hub API's</a>. Specifically in this post I will show you how to grab a number of repositories and count the number of lines of test code contained in the repo.

All code can be found at the repo; <a href="https://github.com/seadavis/GitHubExplorer">GitHub Explorer</a>

## Steps of Algorithm

For this algorithm I chose to focus my efforts on C# repositories in github. Although it would not be hard to do the same thing for
repos written in other languages.

I also didn't focus my attention on well-architected code just something that works. So, this amounts to some straightforward C# code that
can grab and count the number of lines of test code in GitHub repositories.

The basic steps are as follows:
- Create the Client used to talk to GitHub
- Find all of the C# repositories
- Find the directories containing test code in said repositories
- Counting the number of lines in each file in the test repsoitory.

This algorithm is by no means perfect but it should give us a close approximation. I also make no claims that this is the most efficient way to get the content.

### Creating The Client

Creating the client is a fairly straightforward process. Here is the code:

```csharp
var productHeader = new ProductHeaderValue(username);
var github = new GitHubClient(productHeader);
github.Credentials = new Credentials(personalAccessToken);
return github;
```

Username is the name of the user you are using the GitHub client. Here I just made it my own user, seadav. Then the Personal
Access Token was created in developer settings. For more details see: <a heref="https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token">here</a>.

### Getting C# Repositories

To grab all CSharp repositories we simply need to use the SearchRepo method as illustrated below;

```csharp
 var searchResult = await github.Search.SearchRepo(new SearchRepositoriesRequest()
{
    Language = Language.CSharp
});
```

### Getting Test Directories

Once we have the repositories, the next step is to iterate through each repository and get the test directories. The trick here is that, the test directories can be buried inside a directory. So 
we need to recursively search through each directory to get the directory of tests. To determine if a directory contained tests I simply used the heuristic that if the name of the directory
contains the name "test" it probably contains tests.

The github client has a number of properties, each containting specific clients, such as the IRepositoriesClient (Repository) or the ISearchClient (search). Here we are interested in the IRepositories
client which has the property Content which is of type IRepositoryContentClient. The IRepositoryContentClient has a method for getting the top level directories: 

```csharp
Task<IReadOnlyList<RepositoryContent>> GetAllContents(long repositoryId);
```

To grab all of the contents contained withing a directory we can use

```csharp
Task<IReadOnlyList<RepositoryContent>> GetAllContents(long repositoryId, string path);
```

Where path is the Path property found on the directory.

The method we will recursively call can be found in the GitHub Explorer repository, and has the signature

```csharp
IAsyncEnumerable<RepositoryContent> GetTestDirectories(IReadOnlyList<RepositoryContent> contents, Repository repo, GitHubClient client)
```

I had to use IAsyncEnumerable since each of the calls to get the set of repositories is Async. For more details on IAsyncEnumerable see <a href="https://docs.microsoft.com/en-us/archive/msdn-magazine/2019/november/csharp-iterating-with-async-enumerables-in-csharp-8">here</a>.

The complete method for getting test directories is:

```csharp
    static async IAsyncEnumerable<RepositoryContent> GetTestDirectories(IReadOnlyList<RepositoryContent> contents, Repository repo, GitHubClient client)
    {

        for (int i = 0; i < contents.Count; i++)
        {
            if (contents[i].Type.Value == ContentType.Dir)
            {

                var subcontents = await client.Repository.Content.GetAllContents(repo.Id, contents[i].Path);
                var directoryName = contents[i].Name.ToLowerInvariant().Trim();
                var isTestDirectory = directoryName.Contains("test");

                if (!isTestDirectory)
                {
                    var innerContent = GetTestDirectories(subcontents, repo, client);

                    await foreach (var content in innerContent)
                    {
                        yield return content;
                    }
                }
                else
                {
                    yield return contents[i];
                }

            }

        }

    }
```

### Counting Lines in Files

Much like finding the test directories, counting the lines is recursive, since test directories can contain other directories.

The recursive method has the signature: 

```csharp
Task<int> CountLines(GitHubClient client, Repository repo, RepositoryContent dir, string fileExtension)
```

To Check if a Conent is a directory we can use:

```csharp
if(content.Type.Value == ContentType.Dir)
{
    total += await CountLines(client, repo, content, fileExtension);
}
```

Otherwise if it is a file all we need to do is grab the Download URL, and download the file:

```csharp
using (WebClient webClient = new WebClient())
{
    fileContent = webClient.DownloadString(content.DownloadUrl);
}
```

Then we can count the number of lines:

```csharp
 var numberOfLines = fileContent.Split(new string[] { Environment.NewLine }, StringSplitOptions.RemoveEmptyEntries)
                                              .Length;
```

Putting it all together we get:

```csharp
static async Task<int> CountLines(GitHubClient client, Repository repo, RepositoryContent dir, string fileExtension)
{
    int total = 0;

    var subcontents = await client.Repository.Content.GetAllContents(repo.Id, dir.Path);
    Console.WriteLine($"Counting Directory: {dir.Name}");
    for(int i = 0; i < subcontents.Count; i++)
    {
        var content = subcontents[i];

        if(content.Type.Value == ContentType.Dir)
        {
            total += await CountLines(client, repo, content, fileExtension);
        }
        else if(content.Type.Value == ContentType.File)
        {
            var extension = Path.GetExtension(content.Name);

            if(extension == fileExtension)
            {
                string fileContent = string.Empty;
                using (WebClient webClient = new WebClient())
                {
                    fileContent = webClient.DownloadString(content.DownloadUrl);
                }
                if (fileContent != null)
                {
                    var numberOfLines = fileContent.Split(new string[] { Environment.NewLine }, StringSplitOptions.RemoveEmptyEntries)
                                            .Length;
                    total += numberOfLines;
                }

            }
        }
    }

    return total;
}
```