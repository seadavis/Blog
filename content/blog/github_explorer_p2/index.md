---
title: Inverted U Series - Part II
date: "2021-12-05"
description: "Examining Number of lines of Test Code in Projects"
---

In this post I continue my exploration of analyzing code from GitHub. Together we will learn how to invoke powershell 
scripts from C# and how to run mutiple disc bound tasks in parallel, and how to guarantee only N async Tasks are running at any one time.

## Problem and Constraints

My previous blog post, <a href="../github_explorer_p1">Inverted U Series - Part I</a>, explored how to count the number of lines in source code, vs 
the number of lines of test code. However the code in that post had a major issue, mainly it could very easily hit GitHubs limits on requests (5,000 Requests an Hour). So I've
restructured the solution to meet the following requirements:

1) Downloads the repo to your local disk so we don't have to make a large number of calls to the GitHub API.
2) Allows the user to control how many repos are downloaded at once so we don't overload the local disc. 
3) Do as many disc bound operations as possible, at once to keep the CPU as busy as possible.

## High Level Solution

The solution is to break up the download and analysis of each repo into seperate processes. I'll call these processes, Analysis Tasks. 

Each Analysis Task is designed so that, while cloning the git repo the control is given back to the CPU, and
while the content of the files we are analyzing is being grabbed the control is given back to the CPU.

Once each analysis task is done, we delete the folder where the repo was to free up the disc space and start a new download.

All the code in this post can be found at; <a href="https://github.com/seadavis/GitHubExplorer">GitHub Explorer</a>

## Breaking Up Analysis Tasks

### Signature

The signature of the method to breakup the cloning and analysis into seperate threads is 

```csharp
/// <summary>
/// Analyzes the set of repos in parallel.
/// Dumping them in the rootFolder, and then return
/// the results of the analysis.
/// </summary>
/// <param name="repos">The set of repo we are going to analyze</param>
/// <param name="rootFolder">the folder where we will dump the cloned github repo into</param>
/// <param name="repositoriesToParse">the total number of repositories to parse.</param>
/// <param name="degreeOfParallelism">The total number of repos to download at once. Use this number
/// to control filling up disk space.</param>
/// <returns>The results of the analysis.</returns>
public static async Task<List<RepoAnalysisResults>> AnalyzeRepos(IEnumerable<Repository> repos, 
                                                                string rootFolder, 
                                                                int repositoriesToParse, 
                                                                int degreeOfParallelism)
```

### Algorithm

First, we need to grab the total number of repositories we wish to analyze, which is simply done
with the .Take method found on Linq

```csharp
var reposToAnalyze = repos.Take(repositoriesToParse).ToList();
```

Then we have to initialize the analysis to match the degree of parallelism selected by the user.

```csharp
var initialRepos = reposToAnalyze.Take(degreeOfParallelism).ToList();
```

Now, the trickest bit of the code was ensure that when one analysis task is finished, another one begins.

For that we keep track of the tasks that are running, start a loop and then take the first task that is finished

```csharp
List<Task<RepoAnalysisResults>> repoAnalysisTasks = initialRepos.Select(r => AnalyzeRepo(r, rootFolder)).ToList();
while (repoAnalysisTasks.Any())
{
    Task<RepoAnalysisResults> finishedAnalysis = await Task.WhenAny(repoAnalysisTasks); 
```

Once a task is done we remove it from the tasks that are processing

```csharp
repoAnalysisTasks.Remove(finishedAnalysis);
```

Finally, we check if more tasks need to be completed and then start the next one

```csharp
if (nextRepoNumber < reposToAnalyze.Count)
{
    var nextRepo = reposToAnalyze[nextRepoNumber];
    Console.WriteLine($"Adding Analysis For Repo: {nextRepo.Name}");
    repoAnalysisTasks.Add(AnalyzeRepo(nextRepo, rootFolder));
```

Put together the method looks like

```csharp
/// <summary>
/// Analyzes the set of repos in parallel.
/// Dumping them in the rootFolder, and then return
/// the results of the analysis.
/// </summary>
/// <param name="repos">The set of repo we are going to analyze</param>
/// <param name="rootFolder">the folder where we will dump the cloned github repo into</param>
/// <param name="repositoriesToParse">the total number of repositories to parse.</param>
/// <param name="degreeOfParallelism">The total number of repos to download at once. Use this number
/// to control filling up disk space.</param>
/// <returns>The results of the analysis.</returns>
public static async Task<List<RepoAnalysisResults>> AnalyzeRepos(IEnumerable<Repository> repos, 
                                                                string rootFolder, 
                                                                int repositoriesToParse, 
                                                                int degreeOfParallelism)
{
    var reposToAnalyze = repos.Take(repositoriesToParse).ToList();
    var initialRepos = reposToAnalyze.Take(degreeOfParallelism).ToList();
    int nextRepoNumber = degreeOfParallelism;

    List<Task<RepoAnalysisResults>> repoAnalysisTasks = initialRepos.Select(r => AnalyzeRepo(r, rootFolder)).ToList();
    List<RepoAnalysisResults> results = new List<RepoAnalysisResults>();

    while (repoAnalysisTasks.Any())
    {
    Task<RepoAnalysisResults> finishedAnalysis = await Task.WhenAny(repoAnalysisTasks);

    repoAnalysisTasks.Remove(finishedAnalysis);

    var analysis = await finishedAnalysis;
    Console.WriteLine($"Finished Analysis: {analysis}");
    results.Add(analysis);

    if (nextRepoNumber < reposToAnalyze.Count)
    {
        var nextRepo = reposToAnalyze[nextRepoNumber];
        Console.WriteLine($"Adding Analysis For Repo: {nextRepo.Name}");
        repoAnalysisTasks.Add(AnalyzeRepo(nextRepo, rootFolder));
        nextRepoNumber++;
    }
    }

    return results;
}
```

Since each Analysis Task is responsible for deleting the directory it created, a new directory will not be made until an old
one has been deleted.

## Analysis Tasks

To Analyze each repo all I had to do was clone the repo asynchronously

```csharp
var folder = await CloneRepo(repo, rootFolder);
```

Get the test and the non test files in parallel;

```csharp
Console.WriteLine($"Getting Test Files For: {repo.Name}");
var testFilesTask = GetTestFiles(folder);

Console.WriteLine($"Getting Non Test Files For: {repo.Name}");
var nonTestFilesTask = GetNonTestFiles(folder);
```

Count the lines in each set of files in Parallel

```csharp
var testLinesTask = CountLines(testFiles);
var nonTestLinesTask = CountLines(nonTestFiles);

await Task.WhenAll(testLinesTask, nonTestLinesTask);

testLines = await testLinesTask;
nonTestLines = await nonTestLinesTask;
```

Finally we delete the entire directory. That part is key, since otherwise we would risk overrunning the disk.

## How to Clone a Repo in C-Sharp

To Clone a Repo I used a Powershell script to do the actually cloning and building of a new directory. Then I called that script from C#.

The powershell script just takes in two parameters, a github Url to clone and a folder to dump the new directory into. It then, gives the folder a guid name and returns the name
to the process that invoked it.

```powershell
param (
[Parameter(Mandatory=$true)][string]$clone_url,
[Parameter(Mandatory=$true)][string]$root_folder
)

$folder_guid = [guid]::NewGuid()

New-Item -Path $root_folder -Name $folder_guid -ItemType "directory"
$full_folder_name =  "$($root_folder)\$($folder_guid)"

git clone $clone_url $full_folder_name
Write-Host $full_folder_name
```

The code to invoke the powershell script is as follows;

```csharp
InitialSessionState initial = InitialSessionState.CreateDefault();
initial.ExecutionPolicy = Microsoft.PowerShell.ExecutionPolicy.Unrestricted;
Runspace runspace = RunspaceFactory.CreateRunspace(initial);
runspace.Open();

var ps = PowerShell.Create();
ps.Runspace = runspace;

Console.WriteLine($"Cloning Git: {cloneRepo.CloneUrl}");
ps.AddCommand(@".\CloneGit_CreateFolder.ps1");
ps.AddParameter("clone_url", cloneRepo.CloneUrl);
ps.AddParameter("root_folder", rootFolder);
var results = await ps.InvokeAsync();
```

## Deletion Gotcha

There was one Gotcha that surprised me when writing this code. When deleting the folder I needed to call 
```csharp
File.SetAttributes(file, FileAttributes.Normal);
```

Then delete the file before I could recursively delete the file. Instead of just calling,

```csharp
Directory.Delete(target_dir, true);
```

As outlined in, <a href="https://docs.microsoft.com/en-us/dotnet/api/system.io.directory.delete?view=net-6.0"></a>

## Next Steps

Now that I have a method to efficiently check Git repositories without running
into GitHubs API request limits, the next step is to, use this to analyze multiple languages
and dump them into a database.