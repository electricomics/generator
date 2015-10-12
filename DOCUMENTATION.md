The comic platform can benefit the work of research and development that has been done in the web in the past 25 years.

A comic is a normal webpage: it's made of HTML, CSS, JavaScript and images.

A comic needs the HTTP protocol, as in it needs to be served from an HTTP server. This is because some browers will not run some of the APIs under the file protocol (file://), while other APIs will work only under HTTP or HTTPS (like Service Worker, for the latter).
The server doesn't need any particular serverside technology, any static server is fine ([list of http static server one-liners](https://gist.github.com/willurd/5720255)).

The generator tool started as a prototype for the layout tool, in which people could arrange images on a page without having to code anything. I started coding it as a web app for two main reasons:

* I know JavaScript;
* I think the best way to produce a webpage is to use web technologies, so to test it and find bug or inusabilities while making it.

Also, because I **love** web techonologies.

As this was just a quick prototype, there was no backend/server/file writing support, so all the data was saved in a JSON in the localStorage (even the images, in base64 data). Of course I knew about the size limits of the localStorage, but again, it was a prototype more for the UI and the layout functionalities, while new functionalities to read/write the same JSON could have been added later on top.

For the May workshop a dozen students would try and use this tool, but after a previous workshop where the tool was tested, we found out that people really wanted to use a lot of heavy images immediately, so something needed to be changed: we could not write every single images as base64, also because even duplicates of the same file would created more bloated data. So I created a quick node server with an upload system. This way the images were all copied to one single folder, the json (still in the localStorage, at this time) would be lighter, containing only the name of the files.  
The node server needed to be local on each user's computer for two reasons:

* A dozen people uploading and downloading a lot of (heavy) images on the same internet connection would create big problems in the workshop (and long boring waiting times);
* we would need to code and prepare a system where people could upload their images, which would require time and money (account management system, comic management system, hosting, etc etc).

The node local server brought another (obvious) problem: people may not have node on their computers or do not know how to install it, or how to run the server (which at the time required to be done from the command line).

It was also time to fix another problem: writing and reading of physical files. The tool was just not a "layout tool" anymore, nor just a "prototype". We wanted people to be able to create from scratch (images excluded, of course) a comic that could be automatically served to our iPad app. This would required the abilty to write the files (images, javascript, html, css, etc) in a specific folder and then to create an archive with the `.elcx` extensions. Not forgetting the possibility to save and open the project or to pass it to other people/computers before publishing.





# How the generator tool works

The tool is NW.js (previously known ad node-webkit) app.  
For those who don't know it, [NW.js](https://github.com/nwjs/nw.js/), is
> an app runtime based on Chromium and node.js.

or, to put it simply, it's a standalone browser in which it's possible to run web apps.

The choice fell on this system for two reasons:

* we needed something that users could just download and use directly, without the need to install anything or to write any line of command in the terminal;
* part of the generator prototype was already based on `node.js`.

Node.js was chosen because it was an already familiar environment to the involved developers, it has a great number of libraries available (called npm packages), it's well supported in the most popular Operating Systems and its apps are written in JavaScript, language that is already used for the rest of the generator tool.

The node.js part of the tool is responsible to run and maintains a local server on top of which the projects are run. It also has the task of writing and reading the files in the file system (in the computer).
Each project is a different virtual folder mounted on the server, this way we don't have collision problems with the naming of files (each virtual folder get a unique name for the session). Also, thanks to this, is possible to see a preview of the comic in any browers installed on the computer (the local server is accessible to outside the tool itself) or in any computer in the same local network (for example, it can be possible to look at the comic on a tablet or smartphone).
