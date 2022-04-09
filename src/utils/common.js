import axios from 'axios';
import Web3 from 'web3';
import * as math from 'mathjs';
import { createHash } from 'crypto';
import { create, urlSource } from 'ipfs-http-client';
import { subDays, differenceInDays } from 'date-fns';
import Jazzicon from '@metamask/jazzicon';
import { DID, DIDBackend, DefaultDIDAdapter } from '@elastosfoundation/did-js-sdk';
import jwtDecode from 'jwt-decode';

import { essentialsConnector } from '../components/signin-dlg/EssentialConnectivity';
import { stickerContract as STICKER_ADDRESS, marketContract as CONTRACT_ADDRESS, diaContract as DIA_CONTRACT_ADDRESS, blankAddress, ipfsURL, rpcURL } from '../config';
import { PASAR_CONTRACT_ABI } from '../abi/pasarABI';
import { DIAMOND_CONTRACT_ABI } from '../abi/diamondABI';
import { COMMON_CONTRACT_ABI } from '../abi/commonABI';

const pricingContract = [blankAddress, DIA_CONTRACT_ADDRESS]
// Get Abbrevation of hex addres //
export const reduceHexAddress = (strAddress) =>
  strAddress ? `${strAddress.substring(0, 6)}...${strAddress.substring(strAddress.length - 3, strAddress.length)}` : '';

export const fetchFrom = (uri, props = {}) => {
  const backendURL =
    process.env.REACT_APP_ENV === 'production'
      ? process.env.REACT_APP_BACKEND_URL_PRODUCTION
      : process.env.REACT_APP_BACKEND_URL_TEST;
  return fetch(`${backendURL}/${uri}`, props);
};

// Get time from timestamp //
export const getTime = (timestamp) => {
  const date = new Date(timestamp * 1000);
  const pieces = date.toString().split(' ');
  const [wd, m, d, y] = pieces;
  const dateStr = [m, d, y].join('-');

  let hours = date.getHours();
  const suffix = hours >= 12 ? 'PM' : 'AM';
  hours = hours > 12 ? hours - 12 : hours;
  hours = hours.toString().padStart(2, '0');
  const min = date.getMinutes().toString().padStart(2, '0');
  const sec = date.getSeconds().toString().padStart(2, '0');
  const timeStr = [hours, min, sec].join(':').concat(' ').concat([suffix, `UTC${getTimeZone()}`].join(' '));
  return { date: dateStr, time: timeStr };
};

export const getDateTimeString = (date) => `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`

export const getTimeZone = () => {
  const e = String(-(new Date).getTimezoneOffset() / 60);
  return e.includes("-") ? e : "+".concat(e)
}

export const getIpfsUrl = (id) => {
  if (!id) return '';
  const prefixLen = id.split(':', 2).join(':').length;
  if (prefixLen >= id.length) return '';
  const uri = id.substring(prefixLen + 1);
  return `${ipfsURL}/ipfs/${uri}`;
};

export const getAssetImage = (metaObj, isThumbnail = false) => {
  const { asset, thumbnail, tokenJsonVersion, data } = metaObj;
  let cid = asset;
  if (tokenJsonVersion === '2' && !asset) {
    if (!data) cid = '';
    else if (isThumbnail) cid = data.thumbnail;
    else cid = data.image;
  } else if (isThumbnail) cid = thumbnail;
  return getIpfsUrl(cid);
};

export const getCollectionTypeFromImageUrl = (metaObj) => {
  const { asset, tokenJsonVersion, data } = metaObj
  let cid = asset
  if (tokenJsonVersion === '2') {
    if (!data)
      return 1
    cid = data.image
  }
  if(!cid)
    return 1
  const prefix = cid.split(':')[0]
  if(prefix==='pasar')
    return 0
  return 1
};

export const generateJazzicon = (address, size) => {
  if (!address) return Jazzicon(size, 0);
  return Jazzicon(size, parseInt(address.slice(2, 12), 16));
};

export const getElapsedTime = (createdtimestamp) => {
  const currentTimestamp = new Date().getTime() / 1000;
  const timestamp = currentTimestamp - createdtimestamp;
  let strDate = '';
  const nDay = parseInt(timestamp / (24 * 3600), 10);
  const nHour = parseInt(timestamp / 3600, 10) % 24;
  const nMin = parseInt(timestamp / 60, 10) % 60;
  if (nDay > 0) strDate += nDay.concat('d');
  else if (nHour > 0) strDate += ' '.concat(nHour).concat('h');
  else if (nMin > 0) strDate += ' '.concat(nMin).concat('m');
  if (strDate === '') strDate = '0m';
  strDate += ' ago';
  return strDate;
};

export const getBalance = async (connectProvider) => {
  if (!connectProvider) return 0;
  // const walletConnectProvider = essentialsConnector.getWalletConnectProvider();
  const walletConnectWeb3 = new Web3(connectProvider);

  const accounts = await walletConnectWeb3.eth.getAccounts();
  const balance = await walletConnectWeb3.eth.getBalance(accounts[0]);
  return balance;
};

export const getBalanceByAllCoinTypes = (connectProvider, balanceHandler) =>
  new Promise((resolve, reject) => {
    if (!connectProvider) {
      resolve(false)
      return
    }
    
    let count = 0
    // const walletConnectProvider = essentialsConnector.getWalletConnectProvider();
    const walletConnectWeb3 = new Web3(connectProvider);
    walletConnectWeb3.eth.getAccounts().then(accounts=>{
      walletConnectWeb3.eth.getBalance(accounts[0]).then(balance=>{
        balanceHandler(0, math.round(balance / 1e18, 4))
        count+=1
        if(count === 2)
          resolve(true)
      }).catch(err=>{})
      getDiaTokenInfo(accounts[0], connectProvider).then(balance=>{
        balanceHandler(1, balance*1)
        count+=1
        if(count === 2)
          resolve(true)
      }).catch(err=>{})
    }).catch(err=>{
      reject(err)
    })
  })

export function dateRangeBeforeDays(days) {
  return [...Array(days).keys()].map((i) => subDays(new Date(), i).toISOString().slice(0, 10));
}

export function hash(string) {
  return createHash('sha256').update(string).digest('hex');
}

export async function getCoinUSD() {
  try {
    const resCoinPrice = await fetch('https://esc.elastos.io/api?module=stats&action=coinprice');
    const jsonData = await resCoinPrice.json();
    if (jsonData && jsonData.result.coin_usd) return jsonData.result.coin_usd;
    return 0;
  } catch (error) {
    return 0;
  }
}

export function getDiaTokenPrice(connectProvider = null) {
  return new Promise((resolve, reject) => {
    let walletConnectWeb3
    if(connectProvider)
      walletConnectWeb3 = new Web3(connectProvider)
    else if(Web3.givenProvider || Web3.currentProvider || window.ethereum)
      walletConnectWeb3 = new Web3(Web3.givenProvider || Web3.currentProvider || window.ethereum)
    else
      walletConnectWeb3 = new Web3(new Web3.providers.HttpProvider(rpcURL));

    walletConnectWeb3.eth
      .getBlockNumber()
      .then((blocknum) => {
        const graphQLParams = {
          query: `query tokenPriceData { token(id: "0x2c8010ae4121212f836032973919e8aec9aeaee5", block: {number: ${blocknum}}) { derivedELA } bundle(id: "1", block: {number: ${blocknum}}) { elaPrice } }`,
          variables: null,
          operationName: 'tokenPriceData'
        };
        axios({
          method: 'POST',
          url: 'https://api.glidefinance.io/subgraphs/name/glide/exchange',
          headers: {
            'content-type': 'application/json',
            // "x-rapidapi-host": "reddit-graphql-proxy.p.rapidapi.com",
            // "x-rapidapi-key": process.env.RAPIDAPI_KEY,
            accept: 'application/json'
          },
          data: graphQLParams
        }).then((response) => {
          try {
            resolve(response.data.data);
          } catch (error) {
            reject(error);
          }
        });
      })
      .catch((error) => {
        reject(error);
      });
  });
}

export function getDiaTokenInfo(strAddress, connectProvider = null) {
  return new Promise((resolve, reject) => {
    try{
      let walletConnectWeb3
      if(connectProvider)
        walletConnectWeb3 = new Web3(connectProvider)
      else if(Web3.givenProvider || Web3.currentProvider || window.ethereum)
        walletConnectWeb3 = new Web3(Web3.givenProvider || Web3.currentProvider || window.ethereum)
      else
        walletConnectWeb3 = new Web3(new Web3.providers.HttpProvider(rpcURL));
      
      // const web3 = new Web3(Web3.givenProvider);
      // const MyContract = new web3.eth.Contract(DIAMOND_CONTRACT_ABI, DIA_CONTRACT_ADDRESS);
      // MyContract.methods.balanceOf(strAddress).call().then(console.log);

      const diamondContract = new walletConnectWeb3.eth.Contract(DIAMOND_CONTRACT_ABI, DIA_CONTRACT_ADDRESS)
      diamondContract.methods.balanceOf(strAddress).call()
      .then(result=>{
        // console.log(result)
        if(result === '0'){
          resolve(result)
          return
        }
        const balance = walletConnectWeb3.utils.fromWei(result, 'ether');
        resolve(balance)
      }).catch((error) => {
        reject(error);
      })
    } catch(e) {
      reject(e)
    }
  })
}

export async function getERCType(contractAddress, connectProvider = null) {
  try{
    let walletConnectWeb3
    if(connectProvider)
      walletConnectWeb3 = new Web3(connectProvider)
    else if(Web3.givenProvider || Web3.currentProvider || window.ethereum)
      walletConnectWeb3 = new Web3(Web3.givenProvider || Web3.currentProvider || window.ethereum)
    else
      walletConnectWeb3 = new Web3(new Web3.providers.HttpProvider(rpcURL));

    const ercContract = new walletConnectWeb3.eth.Contract(COMMON_CONTRACT_ABI, contractAddress)
    const is721 = await ercContract.methods.supportsInterface('0x80ac58cd').call()
    if(is721)
      return 0
    return 1
  } catch(e) {
    return 1
  }
}

export function getCredentialInfo(strAddress) {
  return new Promise((resolve, reject) => {
    fetchFrom(`auth/api/v1/getCredentials?address=${strAddress}`).then(response=>{
      response.json().then(jsonData => {
        resolve(jsonData.data)
      }).catch((err)=>{
        reject(err)
      })
    }).catch((err)=>{
      reject(err)
    })
  })
}

export function removeLeadingZero(value) {
  return value.replace(/-/g, '').replace(/^0+(?!\.|$)/, '');
}

export function getShortUrl(url) {
  return new Promise((resolve, reject) => {
    fetch(`${process.env.REACT_APP_SHORTEN_SERVICE_URL}/api/v2/action/shorten?key=d306f2eda6b16d9ecf8a40c74e9e91&url=${url}&is_secret=false`).then(resShorternUrl=>{
      resolve(resShorternUrl.text())
    }).catch((err)=>{
      resolve(url)
    })
  });
}

export function callContractMethod(type, coinType, paramObj) {
  return new Promise((resolve, reject) => {
    if (sessionStorage.getItem('PASAR_LINK_ADDRESS') !== '2') {
      reject(new Error());
      return;
    }

    const walletConnectWeb3 = new Web3(isInAppBrowser() ? window.elastos.getWeb3Provider() : essentialsConnector.getWalletConnectProvider());
    walletConnectWeb3.eth
      .getAccounts()
      .then((accounts) => {
        // console.log(accounts)
        const marketContract = new walletConnectWeb3.eth.Contract(PASAR_CONTRACT_ABI, CONTRACT_ADDRESS);
        walletConnectWeb3.eth
          .getGasPrice()
          .then((gasPrice) => {
            console.log('Gas price:', gasPrice);

            const _gasLimit = 5000000;
            console.log('Sending transaction with account address:', accounts[0]);
            const transactionParams = {
              'from': accounts[0],
              'gasPrice': gasPrice,
              'gas': _gasLimit,
              'value': 0
            };
            let method = null;
            if (type === 'createOrderForSale') {
              console.log('createOrderForSale');
              const { _id, _amount, _price, _didUri, _baseAddress = STICKER_ADDRESS } = paramObj;
              console.log(_baseAddress, _id, _amount, pricingContract[coinType], _price, (new Date().getTime()/1000).toFixed(), _didUri)
              method = marketContract.methods.createOrderForSale(_baseAddress, _id, _amount, pricingContract[coinType], _price, (new Date().getTime()/1000).toFixed(), _didUri);
            } else if (type === 'createOrderForAuction') {
              console.log('createOrderForAuction');
              const { _id, _amount, _minPrice, _reservePrice, _buyoutPrice, _endTime, _didUri, _baseAddress = STICKER_ADDRESS } = paramObj;
              console.log(_baseAddress, _id, _amount, pricingContract[coinType], _minPrice, _reservePrice, _buyoutPrice, (new Date().getTime()/1000).toFixed(), _endTime, _didUri)
              method = marketContract.methods.createOrderForAuction(_baseAddress, _id, _amount, pricingContract[coinType], _minPrice, _reservePrice, _buyoutPrice, (new Date().getTime()/1000).toFixed(), _endTime, _didUri);
            } else if (type === 'buyOrder') {
              console.log('buyOrder');
              const { _orderId, _didUri } = paramObj;
              method = marketContract.methods.buyOrder(_orderId, _didUri);
            } else if (type === 'settleAuctionOrder') {
              console.log('settleAuctionOrder');
              const { _orderId } = paramObj;
              method = marketContract.methods.settleAuctionOrder(_orderId);
            } else if (type === 'changeAuctionOrderPrice') {
              console.log('changeAuctionOrderPrice');
              const { _orderId, _price, _reservePrice, _buyoutPrice } = paramObj;
              method = marketContract.methods.changeAuctionOrderPrice(_orderId, _price, _reservePrice, _buyoutPrice, pricingContract[coinType]);
            } else if (type === 'changeSaleOrderPrice') {
              console.log('changeSaleOrderPrice');
              const { _orderId, _price } = paramObj;
              method = marketContract.methods.changeSaleOrderPrice(_orderId, _price, pricingContract[coinType]);
            } else {
              reject(new Error());
              return;
            }
            const { beforeSendFunc, afterSendFunc } = paramObj;
            if (beforeSendFunc) beforeSendFunc();
            method
              .send(transactionParams)
              .on('receipt', (receipt) => {
                if (afterSendFunc) afterSendFunc();
                console.log('receipt', receipt);
                resolve(true);
              })
              .on('error', (error, receipt) => {
                console.error('error', error);
                reject(error);
              });
          })
          .catch((error) => {
            reject(error);
          });
      })
      .catch((error) => {
        reject(error);
      });
  });
}

export function getContractInfo(strAddress) {
  return new Promise((resolve, reject) => {
    try{
      let walletConnectWeb3
      if(Web3.givenProvider || Web3.currentProvider || window.ethereum)
        walletConnectWeb3 = new Web3(Web3.givenProvider || Web3.currentProvider || window.ethereum)
      else
        walletConnectWeb3 = new Web3(new Web3.providers.HttpProvider(rpcURL));
      
      const tokenContract = new walletConnectWeb3.eth.Contract(COMMON_CONTRACT_ABI, strAddress)
      tokenContract.methods.name().call()
        .then(resultName=>{
          tokenContract.methods.symbol().call()
            .then(resultSymbol=>{
              resolve({name: resultName, symbol: resultSymbol})
            }).catch((error) => {
              reject(error)
            })
        }).catch((error) => {
          reject(error)
        })
    } catch(e) {
      reject(e)
    }
  })
}

export const MethodList = [
  {
    method: 'Mint',
    color: '#C4C4C4',
    icon: 'hammer',
    detail: [
      { description: 'Collectible created from mint address', field: 'from', copyable: true, ellipsis: true },
      { description: 'By', field: 'to', copyable: true, ellipsis: true }
    ],
    verb: { description: 'Minted', withPrice: false, subject: 'to' }
  },
  {
    method: 'SafeTransferFromWithMemo',
    color: '#2B86DA',
    icon: 'exchange',
    detail: [
      { description: 'Collectible transferred to', field: 'to', copyable: true, ellipsis: true },
      { description: 'By', field: 'from', copyable: true, ellipsis: true }
    ],
    verb: { description: 'Transferred', withPrice: false, subject: 'to' }
  },
  {
    method: 'SafeTransferFrom',
    color: '#789AB9',
    icon: 'exchange',
    detail: [
      { description: 'Collectible transferred to', field: 'to', copyable: true, ellipsis: true },
      { description: 'By', field: 'from', copyable: true, ellipsis: true }
    ],
    verb: { description: 'Transferred', withPrice: false, subject: 'to' }
  },
  {
    method: 'SetApprovalForAll',
    color: '#17E9C3',
    icon: 'stamp',
    detail: [
      { description: 'Marketplace contract approved →', field: 'to', copyable: true, ellipsis: true },
      { description: 'By', field: 'from', copyable: true, ellipsis: true }
    ]
  },
  {
    method: 'Burn',
    color: '#E96317',
    icon: 'trashcan',
    detail: [
      { description: 'Collectible sent to burn address', field: 'to', copyable: true, ellipsis: true },
      { description: 'By', field: 'from', copyable: true, ellipsis: true }
    ],
    verb: { description: 'Burnt', withPrice: false, subject: 'from' }
  },
  {
    method: 'CreateOrderForSale',
    color: '#5B25CD',
    icon: 'marketplace',
    detail: [
      { description: 'Collectible listed on marketplace →', field: 'marketplace', copyable: true, ellipsis: true },
      { description: 'By', field: 'from', copyable: true, ellipsis: true },
      { description: 'For a value of', field: 'price', copyable: false }
    ],
    verb: { description: 'Listed for', withPrice: true, subject: 'from' }
  },
  {
    method: 'BuyOrder',
    color: '#25CD7C',
    icon: 'basket',
    detail: [
      { description: 'Collectible purchased from', field: 'from', copyable: true, ellipsis: true },
      { description: 'By', field: 'to', copyable: true, ellipsis: true },
      { description: 'For a value of', field: 'price', copyable: false }
    ],
    verb: { description: 'Purchased for', withPrice: true, subject: 'to' }
  },
  {
    method: 'CancelOrder',
    color: '#D60000',
    icon: 'remove',
    detail: [
      { description: 'Collectible removed from marketplace →', field: 'marketplace', copyable: true, ellipsis: true },
      { description: 'By', field: 'from', copyable: true, ellipsis: true }
    ],
    verb: { description: 'Removed', withPrice: false, subject: 'from' }
  },
  {
    method: 'ChangeOrderPrice',
    color: '#CD6B25',
    icon: 'tag',
    detail: [
      { description: 'Collectible value updated to', field: 'data.newPrice', copyable: false },
      { description: 'By', field: 'from', copyable: true, ellipsis: true },
      { description: 'From initial value of', field: 'data.oldPrice', copyable: false }
    ],
    verb: {description: 'Updated to', withPrice: true, subject: 'from'}
  },
  {
    method: 'OrderBid',
    color: '#CD25BC',
    icon: 'auction',
    detail: [
      { description: 'Bid placed on collectible →', field: 'marketplace', copyable: true, ellipsis: true },
      { description: 'By', field: 'to', copyable: true, ellipsis: true },
      { description: 'For a value of', field: 'price', copyable: false }
    ],
    verb: { description: 'Bid', withPrice: true, subject: 'to' }
  },
  {
    method: 'OrderForAuction',
    color: '#25CDCD',
    icon: 'marketplace-auction',
    detail: [
      { description: 'Collectible put up for auction →', field: 'marketplace', copyable: true, ellipsis: true },
      { description: 'By', field: 'from', copyable: true, ellipsis: true },
      { description: 'For a starting price of', field: 'price', copyable: false }
    ],
    verb: { description: 'Put up for auction for a starting price of', withPrice: true, subject: 'from' }
  },
];
export const collectionTypes = [
  {
    shortName: 'PSRC',
    name: 'Pasar Collection',
    avatar: '/static/logo-icon.svg',
    shortDescription: 'Pasar default collection',
    description: 'A collection of all items minted using the Pasar Collection Contract',
    token: 2
  },
  {
    shortName: 'FSTK',
    name: 'Feeds NFT Sticker',
    avatar: '/static/feeds-sticker.svg',
    shortDescription: 'Feeds default collection',
    description: 'A collection of all items minted using the Feeds NFT Stickers Contract',
    token: 1
  },
  // {
  //   shortName: 'Bunny',
  //   name: 'Bunny Punk',
  //   avatar: 'https://ipfs-test.trinity-feeds.app/ipfs/QmVGaCENQCFKm1cJhRWBJ6Wj41LWh1Ev4gjkTBTZCyH7YC',
  //   background: 'https://lh3.googleusercontent.com/fItcL7Th5tjT-54xPOMDWOWWxlAUvROhpH6SiJigUihUa0BusEPFJKI8UkkLyvFEh9Oxl1OBRrv0mZHgPndNf7QocVnqwLxECKlr=h600',
  //   shortDescription: 'Bunny Punk collection',
  //   description: 'Bunny Punk is a collection of 1,000 unique 3D well-designed Bunnies united together to get on the Elastos Smart chain Each Bunny Punk is unique and exclusive based on a hundred traits. The objective is to build the strongest Elastos NFT community and project.'
  // }
]
export const coinTypes = [
  {
    icon: 'elastos.svg',
    name: 'ELA',
    address: blankAddress
  },
  {
    icon: 'badges/diamond.svg',
    name: 'DIA',
    address: DIA_CONTRACT_ADDRESS
  }
]
export const getCoinTypeFromToken = (item) => {
  let coinType = 0
  if(item) {
    const { quoteToken=blankAddress } = item
    coinType = coinTypes.findIndex(el=>el.address===quoteToken)
    coinType = coinType<0?0:coinType
  }
  return coinType
}
export const sendIpfsDidJson = async () => {
  const client = create(`${ipfsURL}/`);
  // create the metadata object we'll be storing
  const did = sessionStorage.getItem('PASAR_DID') || ''
  const token = sessionStorage.getItem("PASAR_TOKEN");
  const user = jwtDecode(token);
  const {name, bio} = user;
  const proof = sessionStorage.getItem("KYCedProof") || ''
  const didObj = {
    "version":"2",
    "did": `did:elastos:${did}`,
    "name": name || '',
    "description": bio || '',
  }
  if(proof.length) {
    didObj.KYCedProof = proof
  }
  const jsonDidObj = JSON.stringify(didObj);
  console.log(jsonDidObj);
  // add the metadata itself as well
  const didUri = await client.add(jsonDidObj);
  return `pasar:json:${didUri.path}`;
};

export const emptyCache = () => {
  if ('caches' in window) {
    caches.keys().then((names) => {
      // Delete all the cache files
      names.forEach((name) => {
        caches.delete(name);
      });
    });

    // Makes sure the page reloads. Changes are only visible after you refresh.
    window.location.reload();
  }
};

export const getInfoFromDID = (did) =>
  new Promise((resolve, reject) => {
    if(!DIDBackend.isInitialized())
      DIDBackend.initialize(new DefaultDIDAdapter('https://api.elastos.io/eid'));
    const didObj = new DID(did);
    didObj
      .resolve(true)
      .then((didDoc) => {
        if (!didDoc) resolve({});
        const credentials = didDoc.getCredentials();
        const properties = credentials.reduce((props, c) => {
          props[c.id.fragment] = c.subject.properties[c.id.fragment];
          return props;
        }, {});
        resolve(properties);
      })
      .catch((error) => {
        reject(error);
      });
  });

export const getDidInfoFromAddress = (address) =>
  new Promise((resolve, reject) => {
    fetchFrom(`pasar/api/v1/getDidByAddress?address=${address}`)
      .then((response) => {
        response
          .json()
          .then((jsonData) => {
            if (jsonData.data && jsonData.data.did)
              getInfoFromDID(jsonData.data.did.did).then((info) => {
                resolve(info);
              });
            else resolve({})
          })
          .catch((error) => {
            reject(error);
          });
      })
      .catch((error) => {
        reject(error);
      });
  });

export const getFullUrl = (url) => `${window.location.protocol}//${window.location.host}/${url}`;

export const checkIsMobile = () =>
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

export const isInAppBrowser = () => window.elastos !== undefined && window.elastos.name === 'essentialsiab';

export const clearCacheData = () => {
  caches.keys().then((names) => {
    names.forEach((name) => {
      caches.delete(name);
    });
  });
};
