const defaultHeaders = {
    'Content-Type': 'application/json'
}

const globalSetting = {
    checkSuccessName: '',
    successValue: '',
    beforeAjax: null,
    afterAjax: null,
    timeoutSecond: 180,
    timeoutCallback: null
}

function encodeBody(data, headers) {
    let contentType = headers['Content-Type']
    if (typeof data === 'string') {
        return encodeURIComponent(data)
    }
    if (typeof data !== 'object') {
        return data
    }

    if (contentType.indexOf('x-www-form-urlencoded')) {
        return Object.keys(data).map(function (key) {
            let value = typeof data[key] === 'object' ? JSON.stringify(data[key]) : data[key]
            return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
        }).join('&')
    } else {
        return JSON.stringify(data)
    }
}

function encodeToUrlQuery(url, data) {
    if (!data) {
        return url
    }

    let queryExist = url.indexOf("?")
    let queryList = []

    for (let key in data) {
        let value = typeof data[key] === 'object' ? JSON.stringify(data[key]) : data[key]
        queryList.push(`${key}=${encodeURIComponent(value)}`)
    }

    return url + (queryExist ? '&' : '') + queryList.join('&')
}

function downloadFile(contentDisposition, fileName, fileStream) {
    let headerFileName = 'download'
    if (contentDisposition) {
        contentDisposition = contentDisposition.toLowerCase()
        headerFileName = contentDisposition.split(";")[1].split("filename=")[1]
    }
    let link = document.createElement('a');
    link.download = fileName || decodeURIComponent(headerFileName);
    link.style.display = 'none';

    var blob = new Blob([fileStream]);
    link.href = URL.createObjectURL(blob);

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function transResponse(response, url, params, headers, method, responseType, download, fileName) {
    return new Promise(function (resolve, reject) {
        try {
            switch (responseType) {
                case 'blob':
                    response.blob().then(function (res) {
                        if (download !== false) {
                            let ContentDisposition = response.headers.get("Content-Disposition")
                            downloadFile(ContentDisposition, fileName, res)
                            return
                        }
                        resolve({
                            success: true,
                            result: res
                        })
                    }).catch(function (res) {
                        resolve({
                            success: false,
                            result: res
                        })
                    })
                    break;
                case 'text':
                    response.text().then(function (res) {
                        if (download !== false) {
                            let ContentDisposition = response.headers.get("Content-Disposition")
                            downloadFile(ContentDisposition, fileName, res)
                            return
                        }
                        resolve({
                            success: true,
                            result: res
                        })
                    }).catch(function (res) {
                        resolve({
                            success: false,
                            result: res
                        })
                    })
                    break;
                case 'json':
                    response.json().then(function (res) {
                        resolve({
                            success: true,
                            result: res
                        })
                    }).catch(function (res) {
                        resolve({
                            success: false,
                            result: res
                        })
                    })
            }
        } catch (res) {
            resolve({
                success: false,
                result: res
            })
        }
    }).then(function (res) {
        if (res.success) {
            return res.result
        } else {
            throw res.result
        }
    })
}

export const setup = function (config) {
    for (let key in globalSetting) {
        if (config[key]) {
            globalSetting[key] = config[key]
        }
    }
}

export const fetch = function (url, options = {}) {
    let method = (options.method || 'get').toUpperCase(),
        headers = Object.assign({}, defaultHeaders, options.headers),
        responseType = options.responseType || 'json',
        download = options.download,
        fileName = options.fileName,
        restParams = options.restParams,
        ignoreGlobalSetting = options.ignoreGlobalSetting || [],
        params = options.params || {}

    let fetchOptions = {
        credentials: 'include',
        method: method,
        headers: headers
    }

    function isIgnoreGlobalSetting(attr) {
        return ignoreGlobalSetting.includes(attr)
    }

    if (restParams) {
        if (!url.endsWith('/')) {
            url = url + '/'
        }
        url = url + restParams.join('/')
    }

    if (method === 'GET') {
        url = encodeToUrlQuery(url, params)
    } else if(method === 'UPLOAD'){
        fetchOptions.method = 'POST'
        delete headers['Content-Type']
        let d = new FormData()

        if (params) {
            for(let key in params){
                d.append(key, params[key])
            }
        }
        fetchOptions.body = d
    }else{
        fetchOptions.body = encodeBody(params, headers)
    }

    if (!isIgnoreGlobalSetting('beforeAjax') && globalSetting.beforeAjax) {
        globalSetting.beforeAjax({
            url,
            options
        })
    }

    let def = window.fetch(url, fetchOptions).then(function (response) {
        return transResponse(response, url, params, headers, method, responseType, download, fileName)
    }).then(function (res) {
        if (!isIgnoreGlobalSetting('afterAjax') && globalSetting.afterAjax) {
            globalSetting.afterAjax({
                url,
                options,
                result: res
            })
        }
        if (!isIgnoreGlobalSetting('checkSuccessName') && globalSetting.checkSuccessName) {
            if (res[globalSetting.checkSuccessName] === globalSetting.successValue) {
                return res
            } else {
                throw res
            }
        } else {
            return res
        }
    })

    let timeoutSecond = !isIgnoreGlobalSetting('timeoutSecond') ? globalSetting.timeoutSecond * 1000 : (24 * 60 * 60 * 1000)

    return Promise.race([
        def,
        !isIgnoreGlobalSetting('timeoutCallback') ? new Promise((resolve, reject) => {
            setTimeout(() => reject(new Error('request timeout')), timeoutSecond);
        }).catch((res) => {
            if (res.message == 'request timeout' && globalSetting.timeoutCallback) {
                globalSetting.timeoutCallback({url, options})
            }
        }) : new Promise(() => {
        })
    ])
}
