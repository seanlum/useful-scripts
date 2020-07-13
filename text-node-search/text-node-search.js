/*
    Text Node Search - https://www.github.com/seanlum - 06-02-2020

        A way of searching plain HTML and text for words, finding them with regular 
        expressions, creating navigatable search results, and leaving an ability to 
        remove all of the finds, as if they were not there, so more searches can be
        made.
*/
(function() {
    document.addEventListener('DOMContentLoaded', function(domContentLoadedEvent) {

        if (window.textNodeSearch === undefined) {
            window.textNodeSearch = {};
        }

        function createTextNodeSearch(config) {
            if (window.textNodeSearch[config.resultGroup] === undefined) {
                window.textNodeSearch[config.resultGroup] = {}
            }
            window.textNodeSearch[config.resultGroup].config = config;
            this.defaultPattern = 'change';
            this.searchPattern = new RegExp(config.searchPattern ? config.searchPattern : this.defaultPattern, 'g');

            function addNodesOf(node) {
                let nodesToCollect = [];
                if (node.hasChildNodes()) {
                    for (let nodeIndex = 0; nodeIndex < node.childNodes.length; nodeIndex++) {
                        nodesToCollect.push({
                            new : true,
                            node : node.childNodes[nodeIndex],
                            parent : node
                        });
                    }
                    return nodesToCollect;
                } else {
                    return false;
                }
            }

            function processNode(data) {
                if (data.node.nodeValue && data.node.nodeValue.match(this.searchPattern)) {
                    if (data.node.innerHTML) {
                        data.node.innerHTML = data.node.nodeValue.replace(this.searchPattern, function(match) {
                            return '<' + config.resultElementType +
                                   ' class="' + config.resultClass + '">' +
                                   match + '</' + config.resultElementType + '>';
                        });
                    } else {
                        let newNode = document.createElement(config.tempElementType);
                        newNode.innerHTML = data.node.nodeValue.replace(this.searchPattern, function(match) {
                            return '<' + config.resultElementType +
                                   ' class="' + config.resultClass + '">' +
                                   match + '</' + config.resultElementType + '>';
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
                let results = document.getElementsByClassName(config.resultClass);
                for (let resultIndex = 0; resultIndex < results.length; resultIndex++) {
                    results[resultIndex].id = config.resultIdPrefix + resultIndex;
                }
            }

            function removeResults() {
                let results = undefined;
                while ((results = document.getElementsByClassName(config.resultClass)).length > 0) {
                    for (let resultIndex = 0; resultIndex < results.length; resultIndex++) {
                        let replacementNode = document.createTextNode(results[resultIndex].innerHTML);
                        results[resultIndex].parentNode.replaceChild(replacementNode, results[resultIndex]);
                    }
                }
                results = undefined;
                while ((results = document.getElementsByTagName(config.tempElementType)).length > 0) {
                    for (let resultIndex = 0; resultIndex < results.length; resultIndex++) {
                        let replacementNode = document.createTextNode(results[resultIndex].innerHTML);
                        results[resultIndex].parentNode.replaceChild(replacementNode, results[resultIndex]);
                    }
                }
            }

            function startTextNodeSearch() {
                this.searchPattern = new RegExp(document.getElementById(config.resultIdPrefix + '-search-field').value, 'g');
                removeResults();
                processDocumentBody();
            }

            let startTextNodeSearchBind = startTextNodeSearch.bind(this);
            let removeResultsBind = removeResults.bind(this);

            window.textNodeSearch[config.resultGroup].removeResults = removeResults;

            let textNodeSearchForm = document.createElement('div');

            let textNodeSearchField = document.createElement('input');
                textNodeSearchField.id = config.resultIdPrefix + '-search-field';
                textNodeSearchField.value = config.searchPattern ? config.searchPattern : this.defaultPattern;
            let textNodeSearchStartButton = document.createElement('button');
                textNodeSearchStartButton.innerText = "Search";
                textNodeSearchStartButton.onclick = startTextNodeSearchBind;
            let textNodeSearchResetButton = document.createElement('button');
                textNodeSearchResetButton.innerText = "Remove Results";
                textNodeSearchResetButton.onclick = removeResultsBind;

            textNodeSearchForm.appendChild(textNodeSearchField);
            textNodeSearchForm.appendChild(textNodeSearchStartButton);
            textNodeSearchForm.appendChild(textNodeSearchResetButton);

            document.body.insertBefore(textNodeSearchForm, document.body.children[0]);
        }

        window.createTextNodeSearch = createTextNodeSearch;
    });
})()