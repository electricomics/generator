# Introduction
This program allows you to create simple Electricomics. Each consisting of a number of images placed on steps.
It is written in Javascript and packaged as an app using NW.js (http://http://nwjs.io).

The intention is to build from here to create the all singing Electricomic Editor that people are crying out for

The Releases tab contains prebuilt binaries for Windows, OS X and Linux.

# Basics
A Project contains all the files needed for an Electricomic. 

From the Generator you can create Create, open, save and close projects. When a project is open you can preview it or examine the files. 

We are working on a producing some better instructions, but for now here are a few key points:

- An Electricomic is portrait or landscape and has a page size that is the same for all pages
- A new page can be added to the Electricomic by clicking the big green button
- Images are added to pages by clicking the *Add Image button*, selecting a file and then clicking **upload**. This is a little cumbersome but you get used to it. We recommend you always use PNG format images
- When you're done and want to share the comic then **Generate** the elcx file and upload onto a convenient web server or share it through Dropbox.
- If you want a custom cover page just copy your image (as a PNG) to cover.png in the Electricomic project folder

# Running from source
- Download the source or clone the github repo.
- Install NodeJS from https://nodejs.org/
- Install the required modules: _npm install_ from theprojects folder
- Install Node Webkit: _npm install nw -g_
- From the electricomics-generator project folder run _nw_

