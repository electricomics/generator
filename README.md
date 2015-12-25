# Introduction
This program allows you to create simple Electricomics. Each consisting of a number of images placed on steps.
It is written in Javascript and packaged as an app using NW.js (http://http://nwjs.io).

The intention is to build from here to create the all singing Electricomic editor that people are crying out for.

The Releases tab contains prebuilt binaries for Windows and OS X. Linux users should be able to run from the **Running from source** section below.

# Getting Started
Until we produce some better instructions [here's a great article](http://dangergeekuk.blogspot.co.uk/2015/09/how-to-make-electricomic.html) by Tim West on getting started with the Generator

# Generator Basics
- You can Create, Open, Save and Close projects. A Project contains all the files needed for an Electricomic. When a project is open you can preview it or examine the generated files.
- An Electricomic is portrait or landscape and has a page size that is the same for all pages.
- A new page can be added to the Electricomic by clicking the big green button.
- Images are added to pages by clicking the *Add Image* button, selecting a file and then clicking *upload*. This is a little cumbersome but you get used to it. We recommend you always use PNG format images.
- When you're done and want to share the comic then *Generate* the elcx file and upload onto a convenient web server or share it through Dropbox. 
- To test in the app, from the homescreen of the Electricomics iPad app, tap the Electricomics *E* and select the Download Arrow icon. Follow the instructions to get your Electricomic downloaded!
- If you want a custom cover page just copy your image (as a PNG) to cover.png in the Electricomic project folder.

# Running from source
- Download the source or clone the github repo
- Install NodeJS from https://nodejs.org/
- Install the required modules: _npm install_ from the projects folder
- From the "generator" project folder run _npm start_

