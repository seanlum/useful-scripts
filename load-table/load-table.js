function createTableCell(content) {
    let newCell = document.createElement('td');
    newCell.innerHTML = content;
    content = newCell;
    return content;
}

function createHeader(data) {
    let newHead = document.createElement('thead');
    data.map(function(item, index, origin) {
        return createTableCell(item);
    }).map(function(tableCell) {
        newHead.appendChild(tableCell);
    })
    data = newHead;
    return data;
}

function createRow(content, searchExpression) {
    let newRow = document.createElement('tr');
    let columns = Object.getOwnPropertyNames(content);
    let matchCount = 0;
    columns.map(function(item, index, origin) {

        if (searchExpression !== undefined) {
            results = String(content[item]).matchAll(searchExpression);
            results = Array.from(results, function(result) {
                return result[0];
            })
            if (results !== undefined && results.length > 0) {
                matchCount += results.length;
            }
        }
        return createTableCell(content[item]);

    }).map(function(tableCell) {

        newRow.appendChild(tableCell);

    })
    content = newRow;
    if (searchExpression !== undefined && matchCount > 0) {
        return {
            rank : matchCount,
            content : content
        };
    } else if (searchExpression === undefined){
        return content;
    } else {
        return false;
    }
}

function loadTable(target, data, headers, filter) {
    target.innerHTML = '';
    target.appendChild(createHeader(headers));
    data = data.map(function(item) {
        return createRow(item, filter);
    })
    if (filter !== undefined) {
        data.sort(function(resultA, resultB) {
            return  resultB.rank - resultA.rank
        })
    }
    data.filter(function(item) {
        return item !== false;
    }).map(function(tableRow) {
        if (filter !== undefined) {
            target.appendChild(tableRow.content);
        } else {
            target.appendChild(tableRow);
        }

    });
}
