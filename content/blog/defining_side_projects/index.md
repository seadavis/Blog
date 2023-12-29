---
title: Planning an Electron Side Project
date: "2022-04-04"
description: "How to define a side project small enough to actually finish"
---

# Introduction

I usually have a side project on the go; however over the past year I haven't really finished a side project. The last one I really finished was a contribution to Sympy. After some reflection during a period of quiet in my life, I've realized why. Each project was too large in a number of ways.

First of all I didn't break things down enough into small atomic tasks so that I could track exactly how much I had done. This is important because success encourages more success. 
As an example, look at the two Azure DevOps boards I made for two different projects below.
- This board for the running app <img src="/devops_clean.png" style="width:1236px;607px;" />
- Look a lot more encouraging than this; <img src="/devops_dirty.png"  style="width:1236px;607px;" />.

Another way in which I've made things too large was trying to plan too much before getting started. When you do this, one of two things tends to happen. Sometimes it turned out some unncoticed assumption in my initial design didn't work with the software the way I planned. Othertimes I simply made the project impossibly large and far too discouraging to work on, as I was never even close to getting the work done.

Needing to get a bit of my mojo back I decided to plan something that was really small. This means I made several choices. Instead of having a large design phase I phrased the development in terms of small questions to figure out how each piece works individually before putting it together. Only once I gained confidence in my approach did I introduce more of a structured design and start doing things like automated testing, and branching. I am not an agile acolyte, I believe in design and slowing down so you can go faster. However I also believe the details in software are hard to get right so it is important to checkout every little assumption before getting started so that every design choice is based in reality.

# Scope of the Project

The scope of the project was pretty straightforward. No bells and whistles, even client server stuff can wait until we have a well defined structure in place.

I am a Marathon Runner and I wanted a solution for planning my route. Yes there are apps that do this, but for one reason or another I wasn't quite happy with those.

There are only three features:
- Make a Route.
- Save a route. 
- Measure distance.

For the Route saving I will just dump the datastructure into a Json file.

# Steps

## Electron
The first question I had to answer was, how do we run an electron app? Electron had been on my radar for quite some time, so I decided this was a good chance to take it out for a spin.<a href="https://www.electronjs.org/docs/latest/tutorial/quick-start">Here is a good post about getting started in electron</a>.

For the first commit see I did see: <a href="https://github.com/seadavis/RunningApp/commit/8a402abf3ce3908a70d22a4cc3852613c4690beb">this link</a>. In this first commit it is lost as I moved fairly quickly in the day, but the first thing I did was just get the electron App up and running. Soon my first goal was completed and I was feeling like a boss.

## Webpack and a Mapping solution

Now I needed to answer the question how do I display and draw on a map. The first mapping solution I tried was <a href="https://openlayers.org/">Open Layer</a>. But the Open Layer tutorials were all in ES6 so I needed a transpiler to transpile ES6 to regular plain old javascript. The big learning curve here was that an Electron App starts on a page called index.html, from which we have to include the relevant javascript. Using Webpack I made the entry point for the ES6 files as src/main.js then transpiled the files into a folder called dist, then linked index.html to the entry point in dist.


This was the webpack configuration
```js
const path = require("path")

module.exports = {
  entry: path.resolve(__dirname, "src/main.js"),
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "index_bundle.js",
    library: "$",
    libraryTarget: "umd",
  },
  module: {
    rules: [
      {
        test: /\.(js)$/,
        exclude: /node_modules/,
        use: "babel-loader",
      },

      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  mode: "development",
} 
```

And then this was main.js

```js
import 'ol/ol.css';
import Map from 'ol/Map';
import OSM from 'ol/source/OSM';
import TileLayer from 'ol/layer/Tile';
import {Point} from 'ol/geom';
import View from 'ol/View';

const place = [51.0447, 114.0719];

const point = new Point(place);

const map = new Map({
  layers: [
    new TileLayer({
      source: new OSM(),
    }),
  ],
  target: 'map',
  view: new View({
    center: [-12697623.442109834, 6628955.677910388],
    zoom: 12,
  }),
});

map.on('click', function(event){

  console.log("Click Coordinate: (" + event.coordinate[0] + ", " + event.coordinate[1] + ")")

});

document.getElementById('zoom-out').onclick = function () {
  const view = map.getView();
  const zoom = view.getZoom();
  view.setZoom(zoom - 1);
};

document.getElementById('zoom-in').onclick = function () {
  const view = map.getView();
  const zoom = view.getZoom();
  view.setZoom(zoom + 1);
}; 
```

## Moving to Leaflet

The next question was how to draw lines with OpenLayers. This was where I ran into some trouble.
OpenLayers had some terms and conditions which limited the number of request in the free version, and they could block you from making requests. Meaning it wasn't suitable to developing a little toy application. A commercial application, sure but not something I'm playing around with. 

I switched to <a href="https://leafletjs.com/SlavaUkraini/reference.html">leaflet</a>. Which actually turned out to be a good choice. I am really enjoying the library so far, they hit a target that can be tough to hit. Easy enough to work with, but flexible enough that it does what we want. By ensuring I could use what I wanted to I didn't waste time designing a solution based on a library that wasn't even going to work in the first place. Instead I quickly learned where my initial assumptions had gone wrong. So, the changes were very easy to make and now any future design work was going to be firmly based in reality.

## Moving to Vue

 It didn't take me long to realize I would need a layer over top of the mapping to control things like saving a file, and in future iterations uploading and downloading to a webserver. Not wanting to assume anything I still didn't design since I wasn't sure if Vue could work with leaflet. Even though I was farily certain Vue and leaflet could be used together or more  I wasn't sure how they would work together.


Now, this part was tricky since I am no javascript expert. I followed the blogpost at <a href="https://blog.logrocket.com/building-app-electron-vue/">blog rocket</a>, and got <i>just</i> Vue working on another repository. Then with a working Vue solution I migrated the mapping portion over, exactly as is, no cleanup and no bells and whistles. The end result of this step can be seen at the following <a href="https://github.com/seadavis/RunningApp/commit/563185d7a583bc6fade81dfbca7810f3e13d92d5">git commit</a>

## Time to Design

Now that we had Vue and the mapping in place it was time to design and add structure. I started branching my solution off, and I added in more classes. But I did this <i>only</i> after some initial experiments and becoming much more confident in my approach. 

## Basic Design

At the time of writing this blog post, there is some design in place.
The main introduction from the design was using the topological routes. As can be seen from <a href="https://github.com/seadavis/RunningApp/blob/mvp/src/components/Map.vue">Map.Vue</a> the whole point of this is to keep connectivity information so that we can insert a point and move the lines as we move the points really easily. I choose to use it as a private class inside of Map.vue because I couldn't see a good way to decouple the too. Furthermore how mapping works is internal to Map.vue. The rest of the application just needs to give the map component a list of points. Maybe if I wanted a little more testing I'd bring carve out those classes, preferably I'd find a way to test if the mapping works the way I wanted it to, and leave the details inside and therefore very flexible.

## Conclusion
Now, I am very close to having a completed side project under my belt.
I owe my success to; 
- Not assuming anything was going to work the way I thought it should.
- Small well-defined scopes
- Breaking everything into tiny tasks.
- Using a project management tool to keep track of my thoughts and keep track of how much I had gotten done.
