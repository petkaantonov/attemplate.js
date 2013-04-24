### Overview

Attemplate.js is javascript templating for those who want familiar syntax and
control in their templates with minimal noise. It is not for those who are
ashamed of logic in templates and prefer hiding it under weird syntax.

Everything in a template is direct output except when a wild unescaped ´@´ character
appears. What happens then is explained in the template expressions below.

[Jsfiddle example](http://jsfiddle.net/9Vsm2/11/)

In its current state, this documentation assumes the reader is already familiar with
javascript templating.

### *Major update 2013-04-10*

- The helpers `htmlEncode` and `htmlDecode` have been removed and replaced with
 first class escaping syntax.

 By default, everything is escaped with html *body* in mind. That is, it is safe
 to do `<div>@data</div>` because the unknown data is embedded in html body context.
 
 For other contexts which include json in script, html attributes, full URLs and
 URL parameters there is new escape syntax.
 
- Templates are automatically ran with `with`-statement now, so instead of `@model.data` you can just
 use `@data`
 
- `this` refers to the passed in data object inside template now.


##Escaping##

The special characters are:

- `\`, used as an escape character
- `@`, the all purpose logic marker
- `}`, when inside a block, `}` marks the end of that block unless escaped `\}`


##Escaping/Encoding for XSS##

###json in script###

For attributes that run javascript (`onmouseover` etc..) and `<script>` tags
there is `@js:data` and the alias `@json:data` to embed json in script. Example:
    

	//template code
	<script type="text/javascript">
		var appData = @json:data;
	</script>

	myTemplate( {
		data: {
			name: "eval(String.fromCharCode(1,2,3,4,5)</script><script>"
		}
	});

	//output when template is ran with example
	<script type="text/javascript">
		var appData = JSON.parse('\u007b\u0022name\u0022\u003a\u0022eval\u0028String\u002efromCharCode\u00281\u002c2\u002c3\u002c4\u002c5\u0029\u003c\u002fscript\u003e\u003cscript\u003e\u0022\u007d');;
	</script>

`appData.name` is then the string `"eval(String.fromCharCode(1,2,3,4,5)</script><script>"` *literally*. `data`
doesn't have to be an object, it can be a string, number or anything that can be serialized with json.

###URLs

For attributes (`src`, `href`, etc) that must include an user submitted URL, there is `@url:data`. Example

	//template code
	<iframe src="@url:data"></iframe>
	
	myTemplate( {
		data: "javascript:alert(123)"
	});
	
	//output:
	<iframe src="https&#58;&#47;&#47;javascript&#58;alert&#40;123&#41;"></iframe>


If input data doesn't start with `http://` or `https://`, one is prepended automatically*. The url
is additionally URL encoded and attribute encoded, so it is safe to use even in an unquoted `src` or `href`
attribute.

*Inferred Automatic prepending is only on client-side, it depends on the current page's scheme. On server-side
`http://` is assumed if necessary.


###Dynamic URL params

For dynamic URL params, like `?key=dynamicvalue`, there is `@urlparam:data`. Example

	//template code
	<a href="post.php?data=@urlparam:data">submit</a>
	
	myTemplate( {
		data: "><script>alert('xss')</script><xss"
	});
	
	//output:
	<a href="post.php?data=&#37;3E&#37;3Cscript&#37;3Ealert&#40;&#39;xss&#39;&#41;&#37;3C&#37;2Fscript&#37;3E&#37;3Cxss">submit</a>
	
The parameter is first URL encoded and then Attribute encoded in case the attribute quotes are left out.

###Other attributes

For any other attribute there is `@attr:data`. It will work even if the attribute is not quoted. It is recommended
to always quote attributes, then you don't have to worry about escaping except for javascript, href and src attributes because
the default html escaping is enough for quoted attributes.

	//template code
	<input value=@attr:data> //<-- unquoted attribute = BAD
	
	myTemplate( {
		data: "hi ><script>alert('xss')</script><xss"
	});
	
	//output:
	<input value=hi&32;&#62;&#60;script&#62;alert&#40;&#39;xss&#39;&#41;&#60;&#47;script&#62;&#60;xss>
	

###No encoding

You might not require encoding when you are calling a helper for example, because helper bodies use the same encoding rules
and the output comes out encoded. In that case you can use `@raw:(myHelper(arg1, arg2))`

**Template expressions**  

[@*limited_expression*](#limited_expression)  
[@( *expression* )](#-expression-)  
[@{ *statements* }](#-statements-)  
[@if ( *expression* )](#if--expression-)  
[@for ( *expression* )](#for--expression-)  
[@while ( *expression* )](#while--expression-)  
[@do { *statements* )](#do--statements-)  
[@with ( *expression* )](#with--expression-)  
[@foreach ( *limited_expression* )](#foreach--expression-)  
[@helper *identifier*](#helper-identifier)  
[@export as *identifier*](#export-as-identifier)  
[@import *identifier*](#import-identifier-as-identifier)  

**API Methods**

[template.fromString](#templatefromstring)  
[template.fromFile](#templatefromfile)  
[template.getById](#templategetbyid)  

### @*limited_expression*

The simplest way to have dynamic output within a template. The expression
is limited to a property access at best and cannot contain spaces:

	<div class="@divClass">@model.message</div>
	
will result in something like `<div class="classyclass">Hello world</div>`. The expression's
output is automatically html encoded by default.

### @( *expression* )

When a limited expression won't just do. The output will be return value of arbitrary javascript expression
contained within the boundaries. The expression's output is automatically html encoded by default.


	<div>@( true ? "yes" : "no")</div>
	
Will result in `<div>yes</div>`

### @{ *statements* }

Arbitrary javascript code can be placed within the boundaries. Will not automatically do anything.
Meant for full control in situations where optimizations are needed or normal featureset is lacking.

	@{
		var hello = "hello world";
	}
	<div>@hello</div>
	

### @if ( *expression* )

`@if` construct provides control flow to your templates. Note that the `@` character
is only required once per full if-elseif-else construct.


	@if( true ) {
		<div>True</div>
	}
	else if( file_not_found ) {
		<div>File not found</div>	
	}
	else {
		<div>False</div>
	}
	
Another example:

	@if( !loggedin ) {
		<div>You are not logged in</div>
	}


### @for ( *expression* )

`@for` can be used for both types of javascript loops, `for..in` and `for(;;)`. Note that
the "non-standard" `@foreach` construct will be more convenient way of looping in most cases.

	<ul>
		@for( var i = 0, len = arr.length; i < len; ++i ) {
			<li>@i: @arr[i]</li>
		}
	</ul>

### @while ( *expression* )

As before, maps to the same javascript equivalent construct.

	@while( true ) {
		@if( true ) {
			<div>lonely div</div>
			@{
				break;
			}
		}
	}

### @do { *statements* }

The only gotcha here is that `expression` in `while( *expression* );` after the `do` block
cannot contain a semicolon (`;`). I'll probably fix it some day.

	@do {
		<div>infinite divs</div>
	} while( true );

### @with ( *expression* )

Same as javascript with statement.

	@with ( model ) {
		<div>@day.@month.@year</div>
	}

### @foreach ( *limited_expression* )

The `@foreach` construct doesn't exist in javascript but because the closest equivalent `for..in`
really sucks for the use case here, I decided to include this magical construct.

It will take a `value in object` expression, and `value` inside the loop will refer to the currently 
iterated value instead of key. Note that because the implementation is a naive regex, you really
cannot use any fancy expressions.

	<ul>
	@foreach( recipe in recipes ) {
		<li>Ingredients for @recipe.name:</li>
		<li>
			<ul>
				@foreach( ingredient in recipe.ingredients ) {
					<li>@ingredient</li>
				}
			</ul>
		</li>
	}
	</ul>

`@foreach` uses `hasOwnProperty` so it's safe to use with arrays but it doesn't optimize for arrays
so it's less efficient than using `@for`.

### @helper *identifier*

The `@helper` can be used to define helper functions inside a template:

	@helper myHelper( arg1, arg2 ) {
		<div>@( (arg1 + arg2).toFixed(2) )</div>
	}
	
	<ul>
		@foreach( number in numbers ) {
			<li>@raw:(myHelper(number,number))</li>
		}
	</ul>
	
Helpers can be used to keep the indentation of templates at sane levels. They don't have
access to template's scope so they can only use passed arguments. `raw:` is used
to not apply any encoding to the helper's output.

### @export as *identifier*

You can use the `@export` construct to export the current template to be used as a helper
in other templates. The identifier needs to be a valid javascript identifier and unique
among other exported templates.

	@export as recipeTemplate
	
	<ul>
	@foreach( recipe in recipes ) {
		<li>Ingredients for @recipe.name:</li>
		<li>
			<ul>
				@foreach( ingredient in recipe.ingredients ) {
					<li>@ingredient</li>
				}
			</ul>
		</li>
	}
	</ul>
	
The above template is now available for other templates to be imported as a helper in that template
to avoid duplication of code. Imported templates take one container object argument
and is known as `model` in the template.

### @import *identifier* \[as *identifier*\]

Import exported templates to be used as a helper in your current template. If you specify `as *identifier*`,
the imported template helper function will be known with that name in the importing template.

	@import recipeTemplate as recipeHelper
	
	<div>
		@raw:( recipeHelper(model) )
	</div>
	
The template to be imported must have been exported with the given identifier or otherwise an error will be thrown.
`raw:` is used to not apply any encoding to the helper's output.

### template.fromString

Given a string, this method parses the string according to the semantics presented above and returns a compiled
function.

	var tmpl = template.fromString( "<div>@model.message</div>" );
	
	var html = tmpl({ 
		message: "Hello World"	
	});
	
	//html === "<div>Hello World</div>"
	
The template isn't cached so parser and function compiling is used every time this is called.	

### template.fromFile

**Node.js only**. Reads the file contents of given filename and returns the compiled template.
The file is read as utf8 and synchronously but is cached for future reads.
	
	var testTemplate = require("attemplate.js").fromFile( "test-template.html" );
	
	console.log( testTemplate({message: "Hello World"} ));
	
Due to synchronous reads, it's best to read all templates to memory when you start the server.
	
### template.getById

**Browers only**. Finds element by given id in the DOM and returns a compiled template
from it's `.innerHTML` property. The template is cached so further calls will instantly
return the already compiled function.

	<script type="text/html" id="my-template">
		<div>@model.message</div>
	</script>
	
	var tmpl = template.getById("my-template");
	
	var html = tmpl({ 
		message: "Hello World"	
	});
		
	//html === "<div>Hello World</div>"


