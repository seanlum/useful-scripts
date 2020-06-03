/*
    Text Node Search - https://www.github.com/seanlum - 06-02-2020

        A way of searching plain HTML and text for words, finding them with regular 
        expressions, creating navigatable search results, and leaving an ability to 
        remove all of the finds, as if they were not there, so more searches can be
        made.
*/
(function() {
    document.addEventListener('DOMContentLoaded', function(domContentLoadedEvent) {
        let searchPattern = new RegExp(document.getElementById('search-field').value, 'g');

        function addNodesOf(node) {
            let nodesToCollect = [];
            if (node.hasChildNodes()) {
                for (let nodeIndex = 0; nodeIndex < node.childNodes.length; nodeIndex++) {
                    nodesToCollect.push({
                        new : true,
                        node : node.childNodes[nodeIndex],
                        parent : node,
                        replaced : false
                    });
                }
                return nodesToCollect;
            } else {
                return false;
            }
        }

        function processNode(data) {
            if (data.node.nodeValue && data.node.nodeValue.match(searchPattern)) {
                if (data.node.innerHTML) {
                    data.node.innerHTML = data.node.nodeValue.replace(searchPattern, function(match) {
                        return '<strong class="temp-search-result">' + match + '</strong>';
                    });
                } else {
                    let newNode = document.createElement('result');
                    newNode.innerHTML = data.node.nodeValue.replace(searchPattern, function(match) {
                        return '<strong class="temp-search-result">' + match + '</strong>';
                    });
                    data.parent.replaceChild(newNode, data.node);
                }

            }
        }

        function processDocumentBody() {
            let bodyNodes = addNodesOf(document.body);
            for (let bodyIndex = 0; bodyIndex < bodyNodes.length; bodyIndex++) {
                if (bodyNodes[bodyIndex].new === true) {
                    bodyNodes[bodyIndex].new = false;
                    let childNodes = addNodesOf(bodyNodes[bodyIndex].node);
                    if (childNodes === false) {
                        processNode(bodyNodes[bodyIndex]);
                    } else if (childNodes.length) {
                        for (let childIndex=0; childIndex<childNodes.length; childIndex++) {
                            bodyNodes.push(childNodes[childIndex]);
                        } 
                    }
                }
            }
            let results = document.getElementsByClassName('temp-search-result');
            for (let resultIndex = 0; resultIndex < results.length; resultIndex++) {
                results[resultIndex].id = 'tsr-n' + resultIndex
            }
        }

        function removeResult() {
            let results = undefined;
            while ((results = document.getElementsByClassName('temp-search-result')).length > 0) {   
                for (let resultIndex = 0; resultIndex < results.length; resultIndex++) {
                    let replacementNode = document.createTextNode(results[resultIndex].innerText);
                    results[resultIndex].parentNode.replaceChild(replacementNode, results[resultIndex]);
                }
            }
            results = undefined;
            while ((results = document.getElementsByTagName('result')).length > 0) {
                for (let resultIndex = 0; resultIndex < results.length; resultIndex++) {
                    let replacementNode = document.createTextNode(results[resultIndex].innerText);
                    results[resultIndex].parentNode.replaceChild(replacementNode, results[resultIndex]);
                }
            }
        }

        window.removeResult = removeResult;

        processDocumentBody();

        window.processRegexSearch = function(searchFieldEvent) {
            searchPattern = new RegExp(document.getElementById('search-field').value, 'g');
            removeResult();
            processDocumentBody();
        }
    });
})()