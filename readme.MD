# lit-fetch
对fetch封装，增强易用性

## Usage
```javascript
import { fetch } from 'lit-fetch'

fetch('/api/save', {
    method: 'post',
    params: {
        name: '张三',
        age: 12
    }
})
```
## Options
* `url`: [String] 请求接口
* `method`: [String] 请求方法，支持get、post、put、delete、upload (其中upload是语法糖，真实接口类型是post类型)
* `params`: [Object | Array] 请求参数
* `responseType`: [String] 接口返回数据类型，支持blob、text、json. 默认json
* `download`: [Boolean] 当responseType为blob或者text时，用于配置是否下载文件. 默认true
* `fileName`: [String] 当download为true时，用于设置下载文件的名称，如果没设置该参数，则从响应头Content-Disposition中获取文件名
* `restParams`: [Array] restful的参数，拼接成url的一部分，值需为字符串数组
* `ignoreGlobalSetting`: [Array] 对该次请求忽略全局配置中哪些项. 默认空。

## GlobalSetting
全局配置
### options
* `checkSuccessName`: [String] 返回结果中判断接口是否成功的顶级属性名
* `successValue`: [Any] checkSuccessName对应属性表示接口成功的值
* `beforeAjax`: [Function] 发送请求前执行 ({url, options})=>{}
* `afterAjax`: [Function] 请求结束执行 ({url, options, result})=>{}
* `timeoutSecond`: [Number] 超时时间,单位s. 默认 180(3分钟)
* `timeoutCallback`: [Any] checkSuccessName对应属性表示接口成功的值

### example
```javascript
    import { setup } from 'lit-fetch'

    setup({
        checkSuccessName: 'success',
        successValue: true,
        beforeAjax(){
            showLoading()
            ...
        },
        afterAjax(){
            hideLoading()
            ...
        }       
    })          
```
