/*

<div>
<form name="daForm">
<P><B>Original:</b></p>
<textarea name="Orig" rows=10 cols=60></textarea>
<br>
<input type=button onClick="CompressConfirm()" value="Compress Code!"><br>
<B><input type=text size=60 name="Progress"></b>
<p>View results of the compression in a <a
href="javascript:CreatePopup(document.daForm.Comp.value);">popup
window</a>.</p>
<p><B>Compressed:</B></p>
<textarea name="Comp" rows=10 cols=60></textarea>
</form></div>

*/

var ua = navigator.userAgent.toLowerCase();
if (ua.indexOf(" chrome/") >= 0 || ua.indexOf(" firefox/") >= 0 || ua.indexOf(' gecko/') >= 0) {
	var StringMaker = function () {
		this.str = "";
		this.length = 0;
		this.append = function (s) {
			this.str += s;
			this.length += s.length;
		}
		this.prepend = function (s) {
			this.str = s + this.str;
			this.length += s.length;
		}
		this.toString = function () {
			return this.str;
		}
	}
} else {
	var StringMaker = function () {
		this.parts = [];
		this.length = 0;
		this.append = function (s) {
			this.parts.push(s);
			this.length += s.length;
		}
		this.prepend = function (s) {
			this.parts.unshift(s);
			this.length += s.length;
		}
		this.toString = function () {
			return this.parts.join('');
		}
	}
}


function MakeIntoString(S) {
	S = StringReplace("\\", "\\\\", S);
	S = StringReplace("\"", "\\\"", S);
	S = StringReplace("\n", "\\n", S);
	return S;
}

function BitsToBytes(i) {
	var o = 42;
	if (i.charAt(0) == '1') {
		o += 32;
	}
	if (i.charAt(1) == '1') {
		o += 16;
	}
	if (i.charAt(2) == '1') {
		o += 8;
	}
	if (i.charAt(3) == '1') {
		o += 4;
	}
	if (i.charAt(4) == '1') {
		o += 2;
	}
	if (i.charAt(5) == '1') {
		o += 1;
	}
	if (o >= 92) {
		o ++;
	}
	return String.fromCharCode(o);
}

function CompressConfirm() {
	if (confirm("Are you sure that you want to do this?  It can take a long time!")) {
		return CompressCode();
	}
}

function CompressCode() {
	// Do initial scan
	var Letters = new Array(256);
	var LetterCodes = new Array(256);
	var C = document.daForm.Comp;
	var P = document.daForm.Progress;
	var ov = document.getElementById('page').value;

	C.value = "Working ...";
	P.value = "Counting Letters";
  var i = 0;
	for (i = 0; i < 256; i ++) {
		Letters[i] = 0;
	}

	for (i = 0; i < ov.length; i ++) {
		if ((i & 0xFF) == 0) {
			P.value = "Counting Letters - " + Math.floor((100 * i) / ov.length) + "%";
		}
		Letters[ov.charCodeAt(i)] ++;
	}

	//   This is a testing tree
	//   It should produce a list like this:
	//               __[  ]__
	//         [  ]~~        ~~[  ]__
	//       50    51        52      ~~[  ]
	//                               53    54
	//
	//   Letters[50] = 7;
	//   Letters[51] = 6;
	//   Letters[52] = 5;
	//   Letters[53] = 2;
	//   Letters[54] = 1;

	// Build a Huffman tree from the letter count frequencies
	var NodeLetter = new Array(512);
	var NodeCount = new Array(512);
	var NodeChild1 = new Array(512);
	var NodeChild2 = new Array(512);
	var NextParent = 0;

	P.value = "Constructing node list";
	for (i = 0; i < 256; i ++) {
		if (Letters[i] > 0) {
			NodeLetter[NextParent] = i;
			NodeCount[NextParent] = Letters[i];
			NodeChild1[NextParent] = -1;
			NodeChild2[NextParent] = -1;
			NextParent ++;
		}
	}

	// Built node list.  Now combine nodes to make a tree
	P.value = "Constructing tree";
	var SmallestNode2 = 1;
	while (SmallestNode2 != -1) {
		var SmallestNode1 = -1;
		SmallestNode2 = -1;

		for (i = 0; i < NextParent; i ++) {
			if (NodeCount[i] > 0) {
				if (SmallestNode1 == -1) {
					SmallestNode1 = i;
				} else if (SmallestNode2 == -1) {
					if (NodeCount[i] < NodeCount[SmallestNode1]) {
						SmallestNode2 = SmallestNode1;
						SmallestNode1 = i;
					} else {
						SmallestNode2 = i;
					}
				} else if (NodeCount[i] <= NodeCount[SmallestNode1]) {
					SmallestNode2 = SmallestNode1;
					SmallestNode1 = i;
				}
			}
		}

		if (SmallestNode2 != -1) {
			NodeCount[NextParent] = NodeCount[SmallestNode1] + NodeCount[SmallestNode2];
			NodeCount[SmallestNode1] = 0;
			NodeCount[SmallestNode2] = 0;
			// Reversed SmallestNode numbers here for ordering in the tree
			NodeChild1[NextParent] = SmallestNode2;
			NodeChild2[NextParent] = SmallestNode1;
			NextParent ++;
		}
	}

	// We have constructed the nodes.  Now rewrite the list into a single
	// array.
	// The value of an array element will be positive if it is the
	// character code we want.  Otherwise, it branches.  The left branch
	// will be the next array element.  The value of the array will be
	// (offset * -1), which is the right branch.
	P.value = "Making final array";
	var FinalNodes = Array(NextParent);
	var DepthIndex = Array(256);
	var Depth = 0;
	var NextFinal = 0;
	DepthIndex[Depth] = SmallestNode1;
	while (Depth >= 0) {
		if (NodeChild1[DepthIndex[Depth]] > -1 && NodeChild2[DepthIndex[Depth]] > -1) {
			// If there is a left and right, push them on the stack
			var idx = NodeChild1[DepthIndex[Depth]];
			NodeChild1[DepthIndex[Depth]] = -2 - NextFinal;
			Depth ++;
			DepthIndex[Depth] = idx;
			NextFinal ++;
		} else if (NodeChild1[DepthIndex[Depth]] < 0 && NodeChild2[DepthIndex[Depth]] > -1) {
			// If there is a left and a right, but the left was taken,
			// push the right on the stack.
			// Update the FinalNodes[] with the location for the right
			// branch.
			idx = NodeChild1[DepthIndex[Depth]];
			idx = 0 - idx;
			idx -= 2;
			FinalNodes[idx] = - NextFinal;

			// Traverse right branch
			idx = NodeChild2[DepthIndex[Depth]];
			NodeChild2[DepthIndex[Depth]] = -2;
			Depth ++;
			DepthIndex[Depth] = idx;
		} else if (NodeChild1[DepthIndex[Depth]] < -1 && NodeChild2[DepthIndex[Depth]] < -1) {
			// If there was a left and a right, but they were both taken, pop up a level
			Depth --;
		} else if (NodeChild1[DepthIndex[Depth]] == -1 && NodeChild2[DepthIndex[Depth]] == -1) {
			// If we have a child here, add it to the final nodes, pop up
			FinalNodes[NextFinal] = NodeLetter[DepthIndex[Depth]];
			NextFinal ++;
			Depth --;
		} else {
			// This shouldn't ever happen
			alert('Bad algorithm!');
			return;
		}
	}


	// We have the tree.  Associate codes with the letters.
	P.value = "Determining codes";
	var CodeIndex = new Array(256);
	DepthIndex[0] = 0;
	CodeIndex[0] = "";
	Depth = 0;
	while (Depth >= 0) {
		if (FinalNodes[DepthIndex[Depth]] < 0) {
			var c = CodeIndex[Depth];
			idx = DepthIndex[Depth];
			DepthIndex[Depth + 1] = DepthIndex[Depth] + 1;
			CodeIndex[Depth + 1] = c + '0';
			DepthIndex[Depth] = 0 - FinalNodes[idx];
			CodeIndex[Depth] = c + '1';
			Depth ++;
		} else {
			LetterCodes[FinalNodes[DepthIndex[Depth]]] = CodeIndex[Depth];
			Depth --;
		}
	}


	// Build resulting data stream
	// The bits string could get very large
	P.value = "Building data stream";
	var bits = "";
	var bytes = new StringMaker();
	for (i = 0; i < ov.length; i ++) {
		if ((i & 0xFF) == 0) {
			P.value = "Building Data Stream - " + Math.floor((100 * i) / ov.length) + "%";
		}
		bits += LetterCodes[ov.charCodeAt(i)];
		while (bits.length > 5) {
			bytes.append(BitsToBytes(bits));
			bits = bits.slice(6, bits.length);
		}
	}
	bytes.append(BitsToBytes(bits));

	P.value = "Writing final script";

	var S = "<scr" + "ipt language=\"JavaScript1.2\">\n<!--\n";
	var encodedNodes = "";
	for (i = 0; i < FinalNodes.length; i ++) {
		var x, y;
		x = FinalNodes[i] + 512;
		y = x & 0x3F;
		x >>= 6;
		x &= 0x3F;
		x += 42;
		y += 42;
		if (x >= 92) {
			x ++;
		}
		if (y >= 92) {
			y ++;
		}
		encodedNodes += String.fromCharCode(x) + String.fromCharCode(y);
	}
	S += 'a=';
	while (encodedNodes.length > 74) {
		S += '"' + encodedNodes.slice(0, 74) + "\"\n+";
		encodedNodes = encodedNodes.slice(74, encodedNodes.length);
	}
	S += '"' + encodedNodes + "\";\n";
	S += "l=new Array();\n";
	S += "while(a.length){l.push((Y(a.charCodeAt(0))<<6)+Y(a.charCodeAt(1))-512);\n";
	S += "a=a.slice(2,a.length)}\n";
	S += 'd=';
	bytes = bytes.toString();
	while (bytes.length > 74) {
		S += '"' + bytes.slice(0, 74) + "\"\n+";
		bytes = bytes.slice(74, bytes.length);
	}
	S += '"' + bytes + "\";\n";
	S += 'c=' + ov.length + ";e=b=a=0;o=\"\";\n";
	S += "function Y(y){if(y>92)y--;return y-42}\n";
	S += "function B(){if(a==0){b=Y(d.charCodeAt(e++));a=6;}\n";
	S += "return ((b>>--a)&0x01);}\n";
	S += "while(c--){i=0;while(l[i]<0){if(B())i=-l[i];else i++;}\n";
	S += "o+=String.fromCharCode(l[i]);}document.write(o);\n";
	S += "// --></scr" + "ipt>";

	C.value = S;

	P.value = "Done.  Compressed by " + Math.floor(100 * (ov.length - S.length) / ov.length) + "% (" + ov.length + " -> " + S.length + ")"
    
}


//URL Shortener...
/** uses jsonstore.io for backend.
<body>
        <input type="url" id="urlinput">
        <button onclick="shorturl()">Short The URL</button>
        <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>
        <script src="main.js"></script>
    </body>
**/

var jsonstore = "https://www.jsonstore.io/32e8bd7b249a8476c7f4c804d041d5519ba92dedb3257e3f0338a581886b6634";

function geturl(path){

    var url = path;
    var protocol_ok = url.startsWith("http://") || url.startsWith("https://") || url.startsWith("ftp://") || url.startsWith("file://");
    if(!protocol_ok){
        newurl = "http://"+url;
        return newurl;
        }else{
            return url;
        }
}

function getrandom() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < 5; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
}

function genhash(){
    if (window.location.hash == ""){
        window.location.hash = getrandom();
    }
}

function send_request(url) {
    this.url = url;
    var subhash =jsonstore + "/" + window.location.hash.substr(1);
    $.ajax({
        'url': subhash,
        'type': 'POST',
        'data': JSON.stringify(this.url),
        'dataType': 'json',
        'contentType': 'application/json; charset=utf-8'
})
}

function shorturl(path){
    var longurl = geturl(path);
    genhash();
    send_request(longurl);
    return window.location.hash.substr(1);
}

var hashh = window.location.hash.substr(1);

if (window.location.hash != "") {
    $.getJSON(jsonstore + "/" + hashh, function (data) {
        data = data["result"];

        if (data != null) {
            window.location.href = data;
        }

    });
}