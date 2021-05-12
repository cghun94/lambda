
var Web3 = require('web3');
let web3 = new Web3(new Web3.providers.HttpProvider('https://mainnet.infura.io/v3/e5605b37b09f4fa3bb14043b8cfc205f'));
const ContractAddress = '0x97836C0CB03b03843A8d77152F5f15096522f98d'; //AIP Contract address
const BurnAddress = '0x000000000000000000000000000000000000dead';//소각 주소

    
exports.handler = async (event, context, callback) => {

    let token , method, result;
    let mid_url=[], data;
    let ABI = await readJson(`./abi/aip.json`); //abi 기본값설정
    const operation = event.httpMethod;

    switch (operation) {
        case 'GET'://GET 형식일때
            if(event.pathParameters === null){//token url null 일때
                result={
                    data : {
                        "message" : `token url null`,
                        "statusCode" : 400
                    }
                }
                callback(null,{
                'statusCode' : 400,
                // 'headers':{'Access-Control-Allow-Origin': '*'},
                'body' : JSON.stringify(result)
                });
            }
            else{//token url 값이 들어있을때
                token = event.pathParameters.token;
                mid_url = token.split('/');//{proxy+} 설정으로 뒤에 값을 / 로 나눈다
                //ABI의 풀더의에 token json 이 존재할시 ,일단 아니면 aip.json 을 불러온다
                if(mid_url[0] === 'aip' || mid_url[0] === 'kbh' || mid_url[0]==='khai'){
                    ABI = await readJson(`./abi/${mid_url[0]}.json`); //abi Application Binary Interface    
                }else{//ABI의 풀더안에서 파일 못찾을시 404 에러 
                    result={
                        data :{
                            "message" : `token not find`,
                            "statusCode" : 404        
                        }
                    }
                    callback(null,{
                    'statusCode' : 404,
                    // 'headers':{'Access-Control-Allow-Origin': '*'},
                    'body' : JSON.stringify(result)
                });
                }
                method =mid_url[1];
                let supplymethodresult =await supplymethod(ABI,method);
                if(supplymethodresult.data.statusCode === 404){
                        callback(null,{
                        'statusCode' : 404,
                        // 'headers':{'Access-Control-Allow-Origin': '*'},
                        'body' : JSON.stringify(supplymethodresult)
                    });
                }
                else if(supplymethodresult.data.statusCode ===400){
                    callback(null,{
                        'statusCode' : 400,
                        // 'headers':{'Access-Control-Allow-Origin': '*'},
                        'body' : JSON.stringify(supplymethodresult)
                    });
                }
                else{
                        callback(null,{
                        'statusCode' : 200,
                        // 'headers':{'Access-Control-Allow-Origin': '*'},
                        'body' : JSON.stringify(supplymethodresult)
                    });
                }
                
            }
            
            break;
        case 'POST':
            callback(null,{
                'statusCode' : 200
            })
            break;
        default:
            callback(new Error(`Error ${operation}`))
    }
};
var fs = require('fs');
async function readJson(path){
  return new Promise(function(resolve,reject){
    fs.readFile(path,(err, data)=>{
      if(err) throw err;
      resolve(JSON.parse(data));
    });
  });
};

async function balanceOf(contract,address) {
  return new Promise(function(resolve,reject){
    contract.methods.balanceOf(address).call().then(function(res){
        //console.log(res);
        resolve( web3.utils.fromWei(res,'ether') ) ;
        //console.log(web3.utils.fromWei(res,'ether'),',')
    });
  });
}
async function totalSupply(contract) {
  return new Promise(function(resolve,reject){
    contract.methods.totalSupply().call().then(function(res){
        resolve( web3.utils.fromWei(res,'ether') ) ;
    });
  });
}

async function supplymethod(ABI,method){
     const lockAddresses = await readJson('./lockup/lockup.json'); //lockup 된 주소 배열
     // console.log("lockup",lockAddresses)
     const lockUpAddresses = lockAddresses.lockup;//lockup 된 주소 배열 값
  
     const lockUpValue = await readJson('./lockup/lockupvalue.json'); //lockup 주소들의 lockup 수량 배열 선언
     const sumAmount = lockUpValue.lockupvalue; //lockup 주소들의 lockup 수량 값
  
     const lockupAmount = sumAmount.reduce((a,b) => {
      //console.log(a,b);
        return a+b;
     },0); //lockup 수량들의 총 합
      //console.log(totalAmount);

     var contract = new web3.eth.Contract(ABI, ContractAddress);
      //console.log(contract);
 
     let burnBalance = await balanceOf(contract,BurnAddress);
 
    let maxsupply = await totalSupply(contract);
    let circulation  = maxsupply - burnBalance - lockupAmount; // aip 총 40억 - 소각 값 - lockup 수량  = 유통량
    let result;
    if(method ==='maxsupply'){
        result={
            data : {
                "maxsupply" : `${maxsupply}`,
                "statusCode" : 200                
            }
        }
        return result;
    }
    else if (method ==='burn') {
        result={
            data : {
               "burnBalance" : `${burnBalance}`,
                "statusCode" : 200                
            }
        }
        return result;
    }
    else if (method ==='totallockup') {
        result={
            data : {
                "lockupAmount" : `${lockupAmount}`,
                "statusCode" : 200                
            }
        }
        return result;
    }
    else if (method ==='circulation') {
        result={
            data : {
                "circulation" : `${circulation}`,
                "statusCode" : 200                
            }
        }
        return result;
    }
    else if (method ===undefined) {
        result={
            data : {
                "message" : `method null`,
                "statusCode" : 400                
            }
        }
        return result;
    }
    else{
        result={
            data : {
                "message" : `method not find`,
                "statusCode" : 404
            }
        }
        return result;
    }
}