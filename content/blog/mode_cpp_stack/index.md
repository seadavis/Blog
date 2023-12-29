---
title: Modern C++ Stack
date: "2022-11-27"
description: "Using C++ and builds to build a modern C++ stack"
---

# Introduction

Quite some time ago my wife who is an avid and talented photographer asked if I could write an application to make taking pictures easier. After some research I agreed that it could be done, and it seemed like
it would be a fun project to take on. We agreed on the name <b>
Field of View</b> and we were off to the races.

I chose to use C++ since it has a very low memory overhead, and has very
good libraries for matrix manipulation. Furthermore GPhoto, a library for controlling a dslr cammera is written in C. An equally justifiable choice would've been Python since it has good C bindings and OpenCV support. However I personally prefer C++, as I find <i>modern</i> C++ to have a good combination of ease of use and flexibility.

C++ though has one flaw, getting a modern workflow which means, easy compilation, and easy testing with a modular design has historically been difficult. However things have changed and with some effort we can use <a href="https://github.com/google/googletest">GTest</a> and <a href="https://cmake.org/">CMake</a> to build a very efficient and modern C++ stack.

## CMake

CMake is a handy tool for C++ that allows us to define the structure of the project without having to rememeber all of the gcc commands necessary to build the project. With CMake we define a top level "project" in this case named "field_of_view", and then pull in libraries. CMake then generates a make file which then can be used to generate the gcc commands to build the final project. 

For the sake of this post library can refer to an "internal library" referring to a set of source files whose code is contained within the project. Library can also refer to an external library, meaning a library written by someone outside of the project whose source files usually reside on the system and not within the project repo.

For those of you familiar with .NET and C# you can think of the top level CMake as the "Solution" and internal libraries as "projects" and external libraries as "Nuget Packages".

For this project the folder structure looks something like

/bin<br />
/build<br />
/src<br />
  &nbsp;&nbsp;&nbsp;&nbsp;/camera<br />
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/src/<br/>
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/tests/<br/>
  &nbsp;&nbsp;&nbsp;&nbsp;/processing<br />
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/src/<br/>
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/tests/<br/>
  &nbsp;&nbsp;&nbsp;&nbsp;/ui<br />
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/src/<br/>
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/tests/<br/>


/bin is where we dump all of the finished binaries. /build is where CMake keeps track of the information it needs to, such as the make file it produces.

/src contains the file CMakeLists.txt which holds the project level definition. So global variables which directories to include etc.

### Project Level Definition

```cmake
project(field_of_view VERSION 1.0.0 LANGUAGES CXX)
```

The top level project, in this case "field_of_view" then can call in libraries both externally and internally.

In the case of "Field Of View" we are using the external libraries;

- Eigen to do matrix operations
- OpenCV to manipulate and represent photos
- GPhoto to control a camera.
- QT to build the UI in C++.

Internally we have a library to wrap GPhoto in C++ and only expose the parts required for our particular project, a library for processing the photos and a library for the UI. I set this up so that the UI knows about both processing and camera, but camera and processing know nothing about each other. In this way processing and camera can change independently but, UI needs to pull in both. This should be a fine assumption for my little project since the job of the UI is to issue commands from the user to both the camera and the various processing functions.

The steps to define the CMake project at the project level are as follows;

<ol>
<li>Set variables

```cmake
set(CMAKE_DEBUG_POSTFIX d)
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_AUTOMOC ON)
set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/../bin)
```
What do these parameters do? Well the standard parameters

```cmake
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
```

set the C++ language to be C++17. I only set this to C++17 because that was the C++ that I was familiar with.

The command; 

```cmake
set(CMAKE_AUTOMOC ON)
```

is required by QT. This command allows the compiler to compile specific QT macros like <a href="https://doc.qt.io/qt-6/signalsandslots.html">Signals and Slots</a> More information can be found here <a href="https://cmake.org/cmake/help/latest/prop_tgt/AUTOMOC.html"></a>

The command; 


```cmake
set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/../bin)
```

sets the directory for the binaries to be the bin/ directory referred to earlier.

</li>

<li> Find Packages with CMake definitions

In this case that's QT5, OpenCV and Eigen.

```cmake
find_package( Qt5Core REQUIRED )
find_package( Qt5Widgets REQUIRED )
find_package( Qt5Gui REQUIRED )
find_package(OpenCV REQUIRED )
find_package (Eigen3 3.3 REQUIRED NO_MODULE)
```

</li>

<li> Add Subdirectories

We now need to tell CMake which subdirectories to traverse looking for CMakeLists.txt that will define the packages and the linking for each library.

```cmake
add_subdirectory(./camera/src)
add_subdirectory(./ui/src)
add_subdirectory(./processing/src)
```
</li>

<li> Define The Executable

Then we use the add_executable to define the entry point for our application.

```cmake
add_executable(field_of_view
    main.cpp
)
```
</li>

<li> Linking

Now the linker needs to know which libraries to link, including the internal libraries

```cmake
target_link_libraries(field_of_view PUBLIC processing camera ui Qt5::Widgets ${OpenCV_LIBS})
```
</li>

<li> Include Directories

We need to use the command;

```cmake
target_include_directories(field_of_view PUBLIC
                          "${PROJECT_BINARY_DIR}"
                          "${PROJECT_SOURCE_DIR}/camera/src/"
                          "${PROJECT_SOURCE_DIR}/ui/src/"
                          )
```

To tell the compiler knows where to find header files for include statements such as,

```cpp
#include "processing.h"
```

Without having processing in the include directory we would have had to write

```cpp
#include "../../processing/src/processing.h"
```
</li>
</ol>

### Internal Libraries

Now we need to add the internal libraries to the CMake definition. For this to work each folder such as /processing needs to have file called CMakeLists.txt. For example

/processing<br />
&nbsp;&nbsp;&nbsp;&nbsp;/src<br/>
&nbsp;&nbsp;&nbsp;&nbsp;/tests<br />
&nbsp;&nbsp;&nbsp;&nbsp;/CMakeLists.txt<br/>

In the CMakeLists.txt under processing we add the "processing" library to the entire project like so;

```cmake
add_library(processing processing.cpp)
```
Then we tell CMake which libraries need to be linked. For example since the UI is aware of both camera processing and QT in the CMakeLists.txt file in then ui folder we need to use the command;

```cmake
target_link_libraries(ui PRIVATE camera processing Qt5::Widgets)
```

We also need to tell the c++ compiler which directories to look in when an include statement is used in the source files. This is done with the following command

```cmake
target_include_directories(ui PUBLIC ../../camera/src/  ../../processing/src/)
```
In the case of the camera library we need to use GPhoto which does not have a cmake definition. For such a library we just pass in the link command to use with gcc which in the case is;

```cmake
target_link_libraries(camera -lgphoto2 -lgphoto2_port)
```

## Gtest and Testing Strategy

GTest outputs an executable so that after each build we get an executable called "unit_tests" put into the same bin directory as the
main program executable that when we run we get output that looks like this 

```
Running main() from /home/sdavis/Source Code/PhotoC/build/_deps/googletest-src/googletest/src/gtest_main.cc
[==========] Running 30 tests from 1 test suite.
[----------] Global test environment set-up.
[----------] 30 tests from CompositeTests/Processing
[ RUN      ] CompositeTests/Processing.BasicComposite/0
[       OK ] CompositeTests/Processing.BasicComposite/0 (862 ms)
[ RUN      ] CompositeTests/Processing.BasicComposite/1
[       OK ] CompositeTests/Processing.BasicComposite/1 (786 ms)
[ RUN      ] CompositeTests/Processing.BasicComposite/2
[       OK ] CompositeTests/Processing.BasicComposite/2 (871 ms)
[ RUN      ] CompositeTests/Processing.BasicComposite/3
[       OK ] CompositeTests/Processing.BasicComposite/3 (830 ms)
[ RUN      ] CompositeTests/Processing.BasicComposite/4
[       OK ] CompositeTests/Processing.BasicComposite/4 (818 ms)
[ RUN      ] CompositeTests/Processing.BasicComposite/5
[       OK ] CompositeTests/Processing.BasicComposite/5 (525 ms)
[ RUN      ] CompositeTests/Processing.BasicComposite/6
[       OK ] CompositeTests/Processing.BasicComposite/6 (437 ms)
[ RUN      ] CompositeTests/Processing.BasicComposite/7
[       OK ] CompositeTests/Processing.BasicComposite/7 (545 ms)
[ RUN      ] CompositeTests/Processing.BasicComposite/8
[       OK ] CompositeTests/Processing.BasicComposite/8 (378 ms)
[ RUN      ] CompositeTests/Processing.BasicComposite/9
[       OK ] CompositeTests/Processing.BasicComposite/9 (348 ms)
[ RUN      ] CompositeTests/Processing.BasicComposite/10
[       OK ] CompositeTests/Processing.BasicComposite/10 (479 ms)
[ RUN      ] CompositeTests/Processing.BasicComposite/11
[       OK ] CompositeTests/Processing.BasicComposite/11 (462 ms)
[ RUN      ] CompositeTests/Processing.BasicComposite/12
[       OK ] CompositeTests/Processing.BasicComposite/12 (579 ms)
[ RUN      ] CompositeTests/Processing.BasicComposite/13
[       OK ] CompositeTests/Processing.BasicComposite/13 (422 ms)
[ RUN      ] CompositeTests/Processing.BasicComposite/14
[       OK ] CompositeTests/Processing.BasicComposite/14 (397 ms)
[ RUN      ] CompositeTests/Processing.BasicComposite/15
[       OK ] CompositeTests/Processing.BasicComposite/15 (1017 ms)
[ RUN      ] CompositeTests/Processing.BasicComposite/16
[       OK ] CompositeTests/Processing.BasicComposite/16 (1024 ms)
[ RUN      ] CompositeTests/Processing.BasicComposite/17
[       OK ] CompositeTests/Processing.BasicComposite/17 (1090 ms)
[ RUN      ] CompositeTests/Processing.BasicComposite/18
[       OK ] CompositeTests/Processing.BasicComposite/18 (993 ms)
[ RUN      ] CompositeTests/Processing.BasicComposite/19
[       OK ] CompositeTests/Processing.BasicComposite/19 (937 ms)
[ RUN      ] CompositeTests/Processing.BasicComposite/20
[       OK ] CompositeTests/Processing.BasicComposite/20 (448 ms)
[ RUN      ] CompositeTests/Processing.BasicComposite/21
[       OK ] CompositeTests/Processing.BasicComposite/21 (420 ms)
[ RUN      ] CompositeTests/Processing.BasicComposite/22
[       OK ] CompositeTests/Processing.BasicComposite/22 (563 ms)
[ RUN      ] CompositeTests/Processing.BasicComposite/23
[       OK ] CompositeTests/Processing.BasicComposite/23 (423 ms)
[ RUN      ] CompositeTests/Processing.BasicComposite/24
[       OK ] CompositeTests/Processing.BasicComposite/24 (376 ms)
[ RUN      ] CompositeTests/Processing.BasicComposite/25
[       OK ] CompositeTests/Processing.BasicComposite/25 (383 ms)
[ RUN      ] CompositeTests/Processing.BasicComposite/26
[       OK ] CompositeTests/Processing.BasicComposite/26 (346 ms)
[ RUN      ] CompositeTests/Processing.BasicComposite/27
[       OK ] CompositeTests/Processing.BasicComposite/27 (496 ms)
[ RUN      ] CompositeTests/Processing.BasicComposite/28
[       OK ] CompositeTests/Processing.BasicComposite/28 (332 ms)
[ RUN      ] CompositeTests/Processing.BasicComposite/29
[       OK ] CompositeTests/Processing.BasicComposite/29 (315 ms)
[----------] 30 tests from CompositeTests/Processing (17922 ms total)

[----------] Global test environment tear-down
[==========] 30 tests from 1 test suite ran. (17922 ms total)
[  PASSED  ] 30 tests.
```

### CMake Setup For GTest

CMake has a special setup for GTest.

First you need to grab the repository for Gtest

```cmake
include(FetchContent)
FetchContent_Declare(
  googletest
  GIT_REPOSITORY https://github.com/google/googletest.git
  GIT_TAG release-1.12.1
)

FetchContent_MakeAvailable(googletest)

```

Then Gtest gets its own executable

```cmake
add_executable(
  unit_tests
  ./processing/tests/composite_tests.cc
)
```

Then into the test executable link the libraries

```cmake
target_link_libraries(
  unit_tests
  processing camera ui Qt5::Widgets GTest::gtest_main ${OpenCV_LIBS}
)
```

Finally tell GTest to find the tests only in the test executable

```cmake
include(GoogleTest)
gtest_discover_tests(unit_tests)

```

### Test Setup

For this project I decided to make each library responsible for its own testing. This was done as UI's are difficult to get testing to be 100% and the portion of code that uses the camera requires a camera to be connected, which is inconvient for writing the processing or for getting the UI layout to be aesthetically pleasing.

The most interesting tests are in the processing library. Correctness is defined by a human and means a picture that "looks" right. Where "looks right" is defined by me.

With theses tests on a single person project what I'm really interested in is, can I make additions and keep the exisitng portions the same. Also known as <i>regression tests</i>. <a href="https://notlaura.com/what-is-a-snapshot-test/">Snapshot tests</a>, are excellent tests for this purpose. The tests produce some output then I verify if that's correct manually and plop it in a folder, which houses the "last stable versions" of the pictures. Then from that point forward I use OpenCV to determine if the images with the latest version of code match the images the last time I said the code was stable. I was able to cover ~300 lines of application code with 95 lines of test code.

To do Data driven tests with GTest all you need to do is provide a "Test Fixture" like so;

```cpp
class Processing :
    public testing::TestWithParam<tuple<string, string>> {
};
```

The important part of the above example is the line;

```cpp
public testing::TestWithParam<tuple<string, string>>
```

This tells GTest what the type is to the arguments of the test. In this case

```cpp
<tuple<string, string>
```

I'm using tuples as the tests in GTest cannot take in more than one argument. This could also be accomplished with arrays or with class or a struct


Then we call INSTANTIATE_TEST_SUITE_P like this;

```cpp
INSTANTIATE_TEST_SUITE_P(CompositeTests,
                         Processing,
                         testing::Values(

                          make_tuple("eagle", "lake"), 
                          make_tuple("eagle", "beach"),
                          make_tuple("eagle", "gothenburg"), 
```

Now for the actual test.

First I grab the parameters

```cpp
  auto args = GetParam();
```

Then I use them to build the filenames and grab the OpenCV reperesentations of the images

```cpp
 // Read in m1
  // Read in m2 (transparent) pixels
  // place m2 in centre of m1
  // test the resulting image (for now just place into folder)
  // then set up regressions
  Mat m1 = imread("./src/processing/tests/target_images/" + get<1>(args) + ".png", IMREAD_UNCHANGED);
  Mat m2 = imread("./src/processing/tests/masks/" + get<0>(args) + ".png", IMREAD_UNCHANGED);
  Mat m3 = imread("./src/processing/tests/original_source_images/" + get<0>(args) + ".png", IMREAD_UNCHANGED);
```

Then I can get on with the rest of the test

```cpp
TEST_P(Processing, BasicComposite) {

  auto args = GetParam();

  
  // Read in m1
  // Read in m2 (transparent) pixels
  // place m2 in centre of m1
  // test the resulting image (for now just place into folder)
  // then set up regressions
  Mat m1 = imread("./src/processing/tests/target_images/" + get<1>(args) + ".png", IMREAD_UNCHANGED);
  Mat m2 = imread("./src/processing/tests/masks/" + get<0>(args) + ".png", IMREAD_UNCHANGED);
  Mat m3 = imread("./src/processing/tests/original_source_images/" + get<0>(args) + ".png", IMREAD_UNCHANGED);

  Mat tgt;
  cvtColor(m1, tgt, CV_BGR2BGRA);

  Mat src;
  cvtColor(m3, src, CV_BGR2BGRA);

  unsigned int tgt_height = m1.size().height;
  unsigned int tgt_width = m1.size().width;

  unsigned int tgt_cy = tgt_height/2;
  unsigned int tgt_cx = tgt_width/2;

  unsigned int src_cy = m2.size().height/2;
  unsigned int src_cx = m2.size().width/2;

  Mat result = processing::composite(m2, src, tgt, tgt_cx - src_cx, tgt_cy - src_cy );
  imwrite( "./src/processing/tests/test_composites/" + get<0>(args) + "_" + get<1>(args) + ".png", result);
  Mat expectedMat = imread("./src/processing/tests/target_composites/" + get<0>(args) + "_" + get<1>(args) + ".png");

  bool const equal = std::equal(result.begin<uchar>(), result.end<uchar>(), expectedMat.begin<uchar>());
  ASSERT_TRUE(equal);
}
```

## Build Script

Finally I found it handy to use a build script so that I didn't need to remember which commands to use and when.

This is a fairly simple build script with three section

<ol>
<li>Invoke cmake

```console
cmake -DCMAKE_BUILD_TYPE=Debug -S./src/ -B./build/ 
cmake --build build
```
</li>

<li>If the user supplies an argument of -t then build and run the tests

```console
if [ "$1" == "-t" ]
then
    ./bin/unit_tests
fi
```
</li>

<li>
If the user supplies and argument of -s then start the application

```console
if [ "$1" == "-s" ]
then
    ./bin/field_of_view
fi
```
</li>

</ol>

## Finishing Thoughts

Now I have a pretty good environment for running a well tested C++17 project. Most of the work involved had to do with compilation and a little bit of testing. I still think that setting up a modern workflow takes a lot of configuration but with C++23 and modules I have high hopes that this will change in the near future. Or maybe a language like Carbon or Herb Sutters C++ experiment will take off and we won't need this level of configuration anymore.