---
title: Azure DevOps Integration Testing
date: "2021-02-28"
description: "How to Set up DevOps Infrastructure for integration testing"
---

In this tutorial you'll learn how to setup the infrastructure in Azure
DevOps for writing tests between a database and server-side code in C#.

More information on Integration Tests can be found in
<a href='https://stackoverflow.com/questions/5357601/whats-the-difference-between-unit-tests-and-integration-tests'>this stack overflow post </a>

$a^2 + b^2 = c^2$

## Preqrequistes

In this post, we will be writing integration tests for a server application,
that has a database, whose schema is given by a code first EntityFramework Core
project.

So, you'll need a database in Azure (although the same idea could be used for 
any cloud provider) and EF Core. 

To read more about the Calendar app, see my 
<a href='/property_testing/'>Previous blog post</a>

## Tests

The integration tests have the following structure:

First, connect to a database

```csharp
  var optionsBuilder = new DbContextOptionsBuilder<CalendarGenContext>();
  optionsBuilder.UseSqlServer(connectionstring);
  SqlServerTaskRepository task = new SqlServerTaskRepository(new CalendarGenContext(optionsBuilder.Options));
  string userGuid = "87779550-7B34-4901-89E6-5F22C05512E0";
  var id = Guid.Parse(userGuid);
```

Then, do a test. In this case I'm testing that,
changing the title of a task persists to the database.

```csharp
   var t1 = task.AddTask(new CalendarTask()
                          {
                              Id = Guid.Empty,
                              StartDate = new DateTime(2021, 3, 2),
                              EndDate = new DateTime(2021, 3, 2, 1, 0, 0),
                              Description = "Some Description test",
                              Title = "Title 1"
                          }, userId);

    t1.Title = "Changed Title";
    task.UpdateTask(t1, userId);
    var t1Get = task.GetTask(t1.Id);
    Assert.AreEqual("Changed Title", t1Get.Title);
```

For now, in the tests I have hardcoded the connection string. The discussion
on how to remove the connection string from source control is outside the
scope of this post.

## DevOps Setup

Since this is an integration test we only want to run the test when merging into main, as a 
last line of defense against bugs. This can be achieved in DevOps in 
two ways. 
  1. Brand new Yaml file for main branch.
  2. Conditionally execute steps in the pipeline.

I usually go with 2, so that my unit tests, and any static or code 
coverage analysis I have setup in the development build pipeline, 
will also run on checkins to the main branch to increase our fortifications against 
bugs.

```yaml
- task: PowerShell@2
  name: 'SetupTestDb'
  inputs:
   filePath: '.\setup_db_test.ps1'
  condition: eq(variables['Build.SourceBranch'], 'refs/heads/main')
```

The condition, on the last line of the yaml task checks that the branch is the main branch.

## Outline of Pipeline

There are a 5 steps to consider when writing an integration test,
in the cloud.

  1. Set up the database including the Schema.
  2. ensure that entity framework core has a user on the databse to create
  the schema and make updates.
  3. run the EF Core migrations
  4. run the tests
  5. delete the database to start form scratch.

I could just as easily have chosen to skip step 1 and instead
drop the schema and leave the users. But for the purpose of
this blog I chose to take down the database entirely.

Each step gets a powershell script and each powershell script is stored in
the root directory of source control.

### Step 1: Set up the Database

To setup the the datase I used the following script:

```powershell
$db3 = "master"
$SQLServer = "calendargen-integration-test.database.windows.net"
$query =  Get-Content .\build_integration_test_db.sql -Raw

Invoke-Sqlcmd -ServerInstance $SQLServer -Database $db3 -Query $query -Username "*" -Password "*" -Verbose -QueryTimeout 0
```

This script, grabs the content of the SQL file.
The script uses Invoke-Sqlcmd to run the sql cmd on the server,
Invoke-Sqlcmd has a query timeout but, for integration tests we don't
necessarily care so we pass an argument of -QueryTimeout 0, to eliminate
the timeout altogether.

The script is excluded since it, just creates the database. You can generate 
do this by use SQL Server's scripting tools.

### Step 2: Entity Framework Core Has a User

For EntityFramework Core's user I'll use CalendarWebApi, which is put on
the database when we first constructed the resource on Azure. 
The script to generate the user is given below. 

Just as in Step 1, we run the below SQL command 
in a Powershell script using Invoke-Sqlcmd.

```SQL
  /****** Object:  User [CalendarWebApi]    Script Date: 2/14/2021 2:15:42 PM ******/
  CREATE USER [CalendarWebApi] FOR LOGIN [CalendarWebApi] WITH DEFAULT_SCHEMA=[dbo]
  GO

  EXEC sp_addrolemember  @rolename =  'db_owner', @membername = 'CalendarWebApi'  
```

### Step 3: Run EF Core Migrations

To run the EF Core migrations we simply use the EF Core command line tools.

```ps
  dotnet tool install --global dotnet-ef
 dotnet ef database update --project .\CalendarGen.Data\CalendarGen.Data.csproj --connection "*" --startup-project CalendarGen.WebApi\CalendarGen.WebApi.csproj --context CalendarGenContext
```

### Step 4:  run the tests

Then, we run the tests just like any other test.
But this time we only want to run the integration test. This can
be accomplished with the following yaml snippet:

```yaml
- task: DotNetCoreCLI@2
  inputs:
    command: test
    projects:  '**/IntegrationTests/*.csproj'
    arguments: '--configuration $(buildConfiguration)'
```

This will work, assuming all of your integration tests are in a 
folder called IntegrationTests.

### Step 5: Delete the Database

Once the tests have run we need to delete the database so we 
can start over next time.

This can be done by running a powershell script with Invoke-Sqlcmd on the 
following sql.

```SQL
DROP DATABASE CalendarGen
```

## Conclusion

And that's all there is to it. It is possible to make this a little
more robust. For example, we could and should remove the connection string
from source control. We could also make our powershell script into a more
general task. 

I hope this showed, that integration testing is simple to add to 
your current coding workflows, and well worth the effort.