function Article (opts) {
  this.author = opts.author;
  this.authorUrl = opts.authorUrl;
  this.title = opts.title;
  this.category = opts.category;
  this.body = opts.body;
  this.publishedOn = opts.publishedOn;
}

// DONE: Instead of a global `articles = []` array, let's track this list of all articles directly on the
// constructor function. Note: it is NOT on the prototype. In JavaScript, functions are themselves
// objects, which means we can add properties/values to them at any time. In this case, we have
// a key/value pair to track, that relates to ALL of the Article objects, so it does not belong on
// the prototype, as that would only be relevant to a single instantiated Article.
Article.all = [];

Article.prototype.toHtml = function() {
  var template = Handlebars.compile($('#article-template').text());

  this.daysAgo = parseInt((new Date() - new Date(this.publishedOn))/60/60/24/1000);
  this.publishStatus = this.publishedOn ? 'published ' + this.daysAgo + ' days ago' : '(draft)';
  this.body = marked(this.body);

  return template(this);
};

// DONE: There are some other functions that also relate to articles across the board, rather than
// just single instances. Object-oriented programming would call these "class-level" functions,
// that are relevant to the entire "class" of objects that are Articles.

// DONE: This function will take the rawData, how ever it is provided,
// and use it to instantiate all the articles. This code is moved from elsewhere, and
// encapsulated in a simply-named function for clarity.
Article.loadAll = function(rawData) {
  rawData.sort(function(a,b) {
    return (new Date(b.publishedOn)) - (new Date(a.publishedOn));
  });

  rawData.forEach(function(ele) {
    Article.all.push(new Article(ele));
  })
}

// This function will retrieve the data from either a local or remote source,
// and process it, then hand off control to the View.
// Article.fetchAll = function() {
//   if (localStorage.rawData) {
//     // When rawData is already in localStorage,
//     // we can load it with the .loadAll function above,
//     // and then render the index page (using the proper method on the articleView object).
//     Article.loadAll(//TODO: What do we pass in here to the .loadAll function?
//       JSON.parse(localStorage.rawData)
//     );
//     articleView.initIndexPage(); //TODO: What method do we call to render the index page?
//   } else {
//     // TODO: When we don't already have the rawData,
//     // we need to retrieve the JSON file from the server with AJAX (which jQuery method is best for this?),
//     // cache it in localStorage so we can skip the server call next time,
//     // then load all the data into Article.all with the .loadAll function above,
//     // and then render the index page.
//     $.getJSON('data/hackerIpsum.json', function(data) {
//       Article.loadAll(data);
//       localStorage.rawData = JSON.stringify(data);
//       articleView.initIndexPage();
//     });
//   }
// };

// STRETCH GOAL: Cache the data source file etag header, to see if it's updated!
// This version follows! Helper function .getAll required.
// This could be dramatically cleaned up with some well-named functions.
Article.fetchAll = function() {
  if (localStorage.rawData) {
    /* If there's data in localStorage, we check if the data has changed before
        requesting all the data. The call cost can be minimized by only
        requesting the header info (type: 'HEAD'), which will give a different
        eTag than our current info if the data has changed. */
    $.ajax({
      url: '/data/hackerIpsum.json',
      type: 'HEAD',
      success: function(data, status, xhr) {
        var eTag = xhr.getResponseHeader('ETag');

        //Check if eTag doesn't exist or compare it to new eTag when it does.
        if(!localStorage.eTag || localStorage.eTag !== eTag) {
          //ETag doesn't exist or is different; assign new one and get new data.
          localStorage.eTag = eTag;
          Article.getAll();
        } else {
          //ETag is fine, load cached data and set up the page.
          Article.loadAll(localStorage.rawData);
          articleView.initIndexPage();
        }
      }
    });
  } else {  //If there's no data in local storage, request it, cache it, and
              // set up the page.
    Article.getAll();
  }
};

Article.getAll = function() {
  $.getJSON('data/hackerIpsum.json', function(data) {
    Article.loadAll(data);
    localStorage.rawData = JSON.stringify(data);
    articleView.initIndexPage();
  });
};
