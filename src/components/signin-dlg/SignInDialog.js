import React, { useState } from 'react';
import { isMobile } from 'react-device-detect';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { Button, Dialog, Stack, DialogTitle, DialogContent, DialogActions, Snackbar, Alert, DialogContentText, IconButton, Typography, Grid, Avatar, Box, Link, Menu, MenuItem } from '@mui/material';
import * as math from 'mathjs';
import { Icon } from '@iconify/react';
import { styled } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';
import CloseIcon from '@mui/icons-material/Close';
import AdbIcon from '@mui/icons-material/Adb';
import AppleIcon from '@mui/icons-material/Apple';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import arrowIosBackFill from '@iconify/icons-eva/arrow-ios-back-fill';
import BookOutlinedIcon from '@mui/icons-material/BookOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import PropTypes from 'prop-types';
import { useWeb3React } from '@web3-react/core';
import { ethers } from 'ethers';
import jwtDecode from 'jwt-decode';
import { DID } from '@elastosfoundation/elastos-connectivity-sdk-js';
import WalletConnectProvider from '@walletconnect/web3-provider';
import { essentialsConnector, useConnectivitySDK, isUsingEssentialsConnector } from './EssentialConnectivity';
import { MIconButton, MFab } from '../@material-extend';
import { injected, walletconnect, walletlink } from './connectors';
import { useEagerConnect, useInactiveListener } from './hook';
import CopyButton from '../CopyButton';
import SnackbarCustom from '../SnackbarCustom';
import PaperRecord from '../PaperRecord';
import { reduceHexAddress, getBalance, getCoinUSD, getDiaTokenInfo, getDiaTokenPrice } from '../../utils/common';
import useSettings from '../../hooks/useSettings';
import useSingin from '../../hooks/useSignin';

const useStyles = makeStyles({
  iconAbsolute1: {
    paddingLeft: 40,
    paddingRight: 80,
    position: 'relative',
    '& .MuiButton-startIcon': {
      position: 'absolute',
      left: 16
    },
    '& .MuiButton-endIcon': {
      position: 'absolute',
      right: 16
    }
  },
  iconAbsolute2: {
    paddingLeft: 40,
    paddingRight: 40,
    position: 'relative',
    '& .MuiButton-startIcon': {
      position: 'absolute',
      left: 16
    }
  }
});

export default function SignInDialog() {
  const {openSigninEssential, openDownloadEssential, afterSigninPath, setOpenSigninEssentialDlg, setOpenDownloadEssentialDlg, setAfterSigninPath, setSigninEssentialSuccess} = useSingin()
  const { pathname } = useLocation();
  const isHome = pathname === '/';

  const { themeMode } = useSettings();
  const isLight = !isHome && themeMode === 'light';

  const ButtonStyle = styled(Button)(
    ({ theme }) =>
      !isLight && {
        backgroundColor: 'white',
        color: theme.palette.background.default,
        '&:hover': {
          backgroundColor: theme.palette.action.active
        }
      }
  );

  const ButtonOutlinedStyle = styled(Button)(
    ({ theme }) =>
      !isLight && {
        borderColor: 'white',
        color: 'white',
        '&:hover': {
          color: theme.palette.background.default,
          backgroundColor: theme.palette.action.active
        }
      }
  );

  let sessionLinkFlag = sessionStorage.getItem('PASAR_LINK_ADDRESS');
  const context = useWeb3React();
  const { connector, activate, active, error, library, chainId, account } = context;
  const [isOpenSnackbar, setSnackbarOpen] = useState(false);
  const [openSignin, setOpenSigninDlg] = useState(false);
  const [openDownload, setOpenDownloadDlg] = useState(false);
  const [activatingConnector, setActivatingConnector] = useState(null);
  const [isOpenAccountPopup, setOpenAccountPopup] = useState(null);
  const [walletAddress, setWalletAddress] = useState(null);
  const [balance, setBalance] = useState(0);
  const [diaBalance, setDiaBalance] = useState(0);
  const [coinUSD, setCoinUSD] = React.useState(0);
  const [diaUSD, setDiaUSD] = React.useState(0);
  const navigate = useNavigate();

  const classes = useStyles();

  const initializeWalletConnection = React.useCallback(async () => {
    if (sessionLinkFlag && !activatingConnector) {
      if (sessionLinkFlag === '1') {
        setActivatingConnector(injected);
        activate(injected);
      } else if (sessionLinkFlag === '2') {
        // if (!essentialsConnector.hasWalletConnectSession()) {
        //   essentialsConnector.setWalletConnectProvider(
        //     new WalletConnectProvider({
        //       rpc: {
        //         20: 'https://api.elastos.io/eth',
        //         21: 'https://api-testnet.elastos.io/eth',
        //         128: 'https://http-mainnet.hecochain.com'
        //       },
        //       bridge: 'https://wallet-connect.trinity-tech.io/v2'
        //     })
        //   );
        // }
        setWalletAddress(await essentialsConnector.getWalletConnectProvider().wc.accounts[0]);
      }
    }
  }, [sessionLinkFlag, activatingConnector]);

  React.useEffect(async () => {
    initializeWalletConnection();
    getCoinUSD().then((res) => {
      setCoinUSD(res);
    });

    if (chainId !== undefined && chainId !== 21 && chainId !== 20) {
      setSnackbarOpen(true);
    }

    // if (active) { // check if is active
    //   if(activatingConnector === injected) {
    //     sessionLinkFlag = '1';
    //     sessionStorage.setItem('PASAR_LINK_ADDRESS', 1);
    //   }
    //   else if (activatingConnector === essentialsConnector) {
    //     sessionLinkFlag = '2';
    //     sessionStorage.setItem('PASAR_LINK_ADDRESS', 2);
    //   }
    // }

    sessionLinkFlag = sessionStorage.getItem('PASAR_LINK_ADDRESS');
    if (sessionLinkFlag) {
      if (sessionLinkFlag === '1' && library) {
        getDiaTokenPrice(library.provider).then(res => {
          setDiaUSD(res.token.derivedELA*res.bundle.elaPrice)
        }).catch((error) => {
          setDiaUSD(0)
        })
        getDiaTokenInfo(account, library.provider).then(dia=>{
          setDiaBalance(dia)
        }).catch((error) => {
          setDiaBalance(0)
        })
        getBalance(library.provider).then((res) => {
          setBalance(math.round(res / 1e18, 4));
        })
        
        setWalletAddress(account);
      }

      if (sessionLinkFlag === '2' && essentialsConnector.getWalletConnectProvider()) {
        const essentialProvider = essentialsConnector.getWalletConnectProvider()
        getDiaTokenPrice(essentialProvider).then(res => {
          setDiaUSD(res.token.derivedELA*res.bundle.elaPrice)
        }).catch((error) => {
          setDiaUSD(0)
        })
        getDiaTokenInfo(essentialProvider.accounts[0], essentialProvider).then(dia=>{
          setDiaBalance(dia)
        }).catch((error) => {
          setDiaBalance(0)
        })
        getBalance(essentialProvider).then((res) => {
          setBalance(math.round(res / 1e18, 4));
        })

        setWalletAddress(essentialProvider.accounts[0]);
      }
    }
  }, [sessionLinkFlag, account, active, chainId, activatingConnector]);
  
  // listen for disconnect from essentials
  React.useEffect(async()=>{
    if(sessionLinkFlag === '2' && activatingConnector === essentialsConnector && !essentialsConnector.getWalletConnectProvider().wc.connected) {
      setOpenAccountPopup(null);
        await activate(null);
        if (sessionStorage.getItem('PASAR_LINK_ADDRESS') === '2')
          essentialsConnector
            .disconnectWalletConnect()
            .then((res) => {})
            .catch((e) => {
              console.log(e);
            });
        sessionStorage.removeItem('PASAR_LINK_ADDRESS');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('did');
        setActivatingConnector(null);
        setWalletAddress(null);
        navigate('/marketplace');
      }
  }, [essentialsConnector.getWalletConnectProvider().wc.connected]);

  useConnectivitySDK();

  // ------------ Connect Wallet ------------
  const handleChooseWallet = async (wallet) => {
    let currentConnector = null;
    if (wallet === 'metamask') currentConnector = injected;
    else if (wallet === 'walletlink') currentConnector = walletlink;
    else if (wallet === 'walletconnect') currentConnector = walletconnect;
    setActivatingConnector(currentConnector);
    await activate(currentConnector);
    // if(active) {
    console.log('loged in');
    sessionLinkFlag = '1';
    sessionStorage.setItem('PASAR_LINK_ADDRESS', 1);
    // }
    setOpenSigninDlg(false);
  };

  const connectWithEssential = async () => {
    const didAccess = new DID.DIDAccess();
    let presentation;
    try {
      presentation = await didAccess.requestCredentials({
        claims: [DID.simpleIdClaim('Your name', 'name', false)]
      });
    } catch (e) {
      try {
        await essentialsConnector.getWalletConnectProvider().disconnect();
      } catch (e) {
        // console.error("Error while trying to disconnect wallet connect session", e);
      }

      return;
    }

    if (presentation) {
      const did = presentation.getHolder().getMethodSpecificId() || '';
      fetch(`${process.env.REACT_APP_BACKEND_URL}/auth/api/v1/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(presentation.toJSON())
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.code === 200) {
            const token = data.data;
            sessionStorage.setItem('token', token);
            sessionStorage.setItem('did', did);
            const user = jwtDecode(token);
            sessionLinkFlag = '2';
            sessionStorage.setItem('PASAR_LINK_ADDRESS', 2);

            setOpenSigninDlg(false);
            setWalletAddress(essentialsConnector.getWalletConnectProvider().accounts[0]);
            setActivatingConnector(essentialsConnector);
            setSigninEssentialSuccess(true)
            if(afterSigninPath){
              setOpenSigninEssentialDlg(false)
              navigate(afterSigninPath)
              setAfterSigninPath(null)
            }
          } else {
            // console.log(data);
          }
        })
        .catch((error) => {});
    }
  };

  const handleClickOpenSinginDlg = () => {
    setOpenSigninDlg(true);
  };
  const handleClickOpenDownloadDlg = () => {
    setOpenSigninDlg(false);
    setOpenDownloadDlg(true);
  };
  const handleClickOpenDownloadEssentialDlg = () => {
    setOpenSigninEssentialDlg(false);
    setOpenDownloadEssentialDlg(true);
  };
  const handleGoBack = () => {
    setOpenSigninDlg(true);
    setOpenDownloadDlg(false);
  };
  const handleGoBackEssential = () => {
    setOpenSigninEssentialDlg(true);
    setOpenDownloadEssentialDlg(false);
  };
  const handleCloseSigninDlg = () => {
    setOpenSigninDlg(false);
  };
  const handleCloseSigninEssentialDlg = () => {
    setOpenSigninEssentialDlg(false);
  };
  const handleCloseDownloadEssentialDlg = () => {
    setOpenDownloadEssentialDlg(false);
  };
  const handleCloseDownloadDlg = () => {
    setOpenDownloadDlg(false);
  };

  const openAccountMenu = (event) => {
    if (isMobile && event.type === 'mouseenter') return;
    setOpenAccountPopup(event.currentTarget);
  };
  const closeAccountMenu = async (e) => {
    setOpenAccountPopup(null);
    if (e.target.getAttribute('value') === 'signout') {
      await activate(null);
      if (sessionStorage.getItem('PASAR_LINK_ADDRESS') === '2')
        essentialsConnector
          .disconnectWalletConnect()
          .then((res) => {})
          .catch((e) => {
            console.log(e);
          });
      sessionStorage.removeItem('PASAR_LINK_ADDRESS');
      setSigninEssentialSuccess(false)
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('did');
      setActivatingConnector(null);
      setWalletAddress(null);
      navigate('/marketplace');
    }
  };

  return (
    <>
      {walletAddress ? (
        <>
          <MFab id="signin" size="small" onClick={openAccountMenu} onMouseEnter={openAccountMenu}>
            <AccountCircleOutlinedIcon />
          </MFab>
          <Menu
            keepMounted
            id="simple-menu"
            anchorEl={isOpenAccountPopup}
            onClose={closeAccountMenu}
            open={Boolean(isOpenAccountPopup)}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            MenuListProps={{ onMouseLeave: ()=>setOpenAccountPopup(null) }}
          >
            <Box sx={{ px: 2, py: '6px' }}>
              <Typography variant="h6">
                {reduceHexAddress(walletAddress)} <CopyButton text={walletAddress} sx={{ mt: '-3px' }} />
              </Typography>
              {sessionStorage.getItem('did') ? (
                <Typography variant="body2" color="text.secondary">
                  did:elastos:{sessionStorage.getItem('did')}
                  <CopyButton text={`did:elastos:${sessionStorage.getItem('did')}`} />
                </Typography>
              ) : (
                <Link
                  underline="hover"
                  onClick={() => {
                    setOpenDownloadDlg(true);
                  }}
                  sx={{ cursor: 'pointer' }}
                >
                  Get DID now!
                </Link>
              )}
              <Stack spacing={1}>
                <PaperRecord
                  sx={{
                    p: 1.5,
                    textAlign: 'center',
                    minWidth: 300
                  }}
                >
                  <Typography variant="h6">Total Balance</Typography>
                  <Typography variant="h3" color="origin.main">
                    USD {math.round(math.round(coinUSD * balance, 2) + math.round(diaUSD * diaBalance, 2), 2)}
                  </Typography>
                  <Button
                    href="https://glidefinance.io/swap"
                    target="_blank"
                    variant="outlined"
                    fullWidth
                    sx={{ textTransform: 'none' }}
                    color="inherit"
                  >
                    Add funds
                  </Button>
                </PaperRecord>
                <PaperRecord sx={{ p: 1.5 }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Box
                      draggable={false}
                      component="img"
                      alt=""
                      src="/static/elastos.svg"
                      sx={{ width: 24, height: 24 }}
                    />
                    <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                      <Typography variant="body2"> ELA </Typography>
                      <Typography variant="body2" color="text.secondary"> Elastos (ESC) </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" align="right"> {balance} </Typography>
                      <Typography variant="body2" align="right" color="text.secondary"> USD {math.round(coinUSD * balance, 2)} </Typography>
                    </Box>
                  </Stack>
                </PaperRecord>
                <PaperRecord sx={{ p: 1.5 }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Box
                      draggable={false}
                      component="img"
                      alt=""
                      src="/static/badges/diamond.svg"
                      sx={{ width: 24, height: 24 }}
                    />
                    <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                      <Typography variant="body2"> DIA </Typography>
                      <Typography variant="body2" color="text.secondary"> Diamond (ESC) </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" align="right"> {diaBalance} </Typography>
                      <Typography variant="body2" align="right" color="text.secondary"> USD {math.round(diaUSD * diaBalance, 2)} </Typography>
                    </Box>
                  </Stack>
                </PaperRecord>
              </Stack>
            </Box>
            <MenuItem to="/profile/myitem" onClick={closeAccountMenu} component={RouterLink}>
              <BookOutlinedIcon />
              &nbsp;My Items
            </MenuItem>
            {/* <MenuItem onClick={closeAccountMenu}>
              <SettingsOutlinedIcon />
              &nbsp;Settings
            </MenuItem> */}
            <MenuItem value="signout" onClick={closeAccountMenu} id="signout">
              <LogoutOutlinedIcon />
              &nbsp;Sign Out
            </MenuItem>
          </Menu>
        </>
      ) : (
        <div>
          <Button id="signin" variant="contained" onClick={handleClickOpenSinginDlg}>
            Sign In
          </Button>

          <Dialog open={openSignin} onClose={handleCloseSigninDlg}>
            <DialogTitle>
              <IconButton
                aria-label="close"
                onClick={handleCloseSigninDlg}
                sx={{
                  position: 'absolute',
                  right: 8,
                  top: 8,
                  color: (theme) => theme.palette.grey[500]
                }}
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent>
              <Typography variant="h3" component="div" sx={{ color: 'text.primary' }} align="center">
                Sign in with your DID
              </Typography>
              <Box component="div" sx={{ maxWidth: 350, m: 'auto' }}>
                <Typography variant="p" component="div" sx={{ color: 'text.secondary' }} align="center">
                  Sign in with one of the available providers or create a new one.
                  <Link href="https://www.elastos.org/did" underline="hover" color="red" target="_blank">
                    What is a DID?
                  </Link>
                </Typography>
                <Grid container spacing={2} sx={{ my: 4 }}>
                  <Grid item xs={12} sx={{ pt: '0 !important' }}>
                    <Typography variant="body2" display="block" gutterBottom align="center">
                      Web3.0 super wallet with Decentralized Identifier (DID)
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sx={{ pt: '8px !important' }}>
                    <ButtonStyle
                      variant="contained"
                      startIcon={
                        <Avatar
                          alt="Elastos"
                          src="/static/elastos.svg"
                          sx={{ width: 24, height: 24, backgroundColor: 'white', p: '5px' }}
                        />
                      }
                      endIcon={
                        <Typography variant="p" sx={{ fontSize: '0.875rem !important' }}>
                          <span role="img" aria-label="">
                            🔥
                          </span>
                          Popular
                        </Typography>
                      }
                      className={classes.iconAbsolute1}
                      fullWidth
                      onClick={() => {
                        connectWithEssential();
                      }}
                      sx={!isLight && { backgroundColor: 'white' }}
                    >
                      Elastos Essentials
                    </ButtonStyle>
                  </Grid>
                  <Grid item xs={12} sx={{ pt: '8px !important' }}>
                    <Typography variant="body2" display="block" gutterBottom align="center">
                      Just basic wallet and no DID
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sx={{ pt: '8px !important' }}>
                    <ButtonStyle
                      variant="contained"
                      startIcon={
                        <Avatar
                          alt="metamask"
                          src="/static/metamask.svg"
                          sx={{ width: 24, height: 24, backgroundColor: 'white', p: '5px' }}
                        />
                      }
                      className={classes.iconAbsolute2}
                      fullWidth
                      onClick={() => {
                        handleChooseWallet('metamask');
                      }}
                    >
                      MetaMask
                    </ButtonStyle>
                  </Grid>
                  <Grid item xs={12}>
                    <ButtonStyle
                      variant="contained"
                      startIcon={
                        <Avatar
                          alt="walletconnect"
                          src="/static/walletconnect.svg"
                          sx={{ width: 24, height: 24, backgroundColor: 'white', p: '5px' }}
                        />
                      }
                      className={classes.iconAbsolute2}
                      fullWidth
                      onClick={() => {
                        handleChooseWallet('walletconnect');
                      }}
                    >
                      WalletConnect
                    </ButtonStyle>
                  </Grid>
                  <Grid item xs={12}>
                    <ButtonOutlinedStyle variant="outlined" fullWidth onClick={handleClickOpenDownloadDlg}>
                      I don’t have a wallet
                    </ButtonOutlinedStyle>
                  </Grid>
                </Grid>
              </Box>
              <Typography
                variant="caption"
                display="block"
                sx={{ color: 'text.secondary' }}
                gutterBottom
                align="center"
              >
                We do not own your private keys and cannot access your funds without your confirmation.
              </Typography>
            </DialogContent>
          </Dialog>
        </div>
      )}
      <Dialog open={openDownload} onClose={handleCloseDownloadDlg}>
        <DialogTitle>
          <IconButton
            aria-label="close"
            onClick={handleCloseDownloadDlg}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500]
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography variant="h3" component="div" sx={{ color: 'text.primary' }} align="center">
            Download Essentials
          </Typography>
          <Typography variant="p" component="div" sx={{ color: 'text.secondary' }} align="center">
            Get Elastos Essentials now to kickstart your journey!
            <br />
            It is your gateway to Web3.0!
          </Typography>
          <Typography variant="body2" display="block" gutterBottom align="center" sx={{ mt: 4 }}>
            Web3.0 super wallet with Decentralized Identifier (DID)
          </Typography>
          <Box component="div" sx={{ maxWidth: 300, m: 'auto' }}>
            <Grid container spacing={2} sx={{ mt: 2, mb: 4 }}>
              <Grid item xs={12} sx={{ pt: '8px !important' }}>
                <ButtonStyle
                  variant="contained"
                  href="https://play.google.com/store/apps/details?id=org.elastos.essentials.app"
                  target="_blank"
                  startIcon={<AdbIcon />}
                  className={classes.iconAbsolute2}
                  fullWidth
                >
                  Google Play
                </ButtonStyle>
              </Grid>
              <Grid item xs={12}>
                <ButtonOutlinedStyle
                  variant="outlined"
                  href="https://apps.apple.com/us/app/elastos-essentials/id1568931743"
                  target="_blank"
                  startIcon={<AppleIcon />}
                  className={classes.iconAbsolute2}
                  fullWidth
                >
                  App Store
                </ButtonOutlinedStyle>
              </Grid>
              <Grid item xs={12} align="center">
                <Button color="inherit" startIcon={<Icon icon={arrowIosBackFill} />} onClick={handleGoBack}>
                  Go back
                </Button>
              </Grid>
            </Grid>
          </Box>
          <Typography variant="caption" display="block" sx={{ color: 'text.secondary' }} gutterBottom align="center">
            We do not own your private keys and cannot access your funds without your confirmation.
          </Typography>
        </DialogContent>
      </Dialog>
      <Dialog open={openSigninEssential} onClose={handleCloseSigninEssentialDlg}>
        <DialogTitle>
          <IconButton
            aria-label="close"
            onClick={handleCloseSigninEssentialDlg}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500]
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography variant="h3" component="div" sx={{ color: 'text.primary' }} align="center">
            Sign in with your DID
          </Typography>
          <Box component="div" sx={{ maxWidth: 350, m: 'auto' }}>
            <Typography variant="p" component="div" sx={{ color: 'text.secondary' }} align="center">
              Sign in with one of the available providers or create a new one.
              <Link href="https://www.elastos.org/did" underline="hover" color="red" target="_blank">
                What is a DID?
              </Link>
            </Typography>
            <Grid container spacing={2} sx={{ my: 4 }}>
              <Grid item xs={12} sx={{ pt: '0 !important' }}>
                <Typography variant="body2" display="block" gutterBottom align="center">
                  Web3.0 super wallet with Decentralized Identifier (DID)
                </Typography>
              </Grid>
              <Grid item xs={12} sx={{ pt: '8px !important' }}>
                <ButtonStyle
                  variant="contained"
                  startIcon={
                    <Avatar
                      alt="Elastos"
                      src="/static/elastos.svg"
                      sx={{ width: 24, height: 24, backgroundColor: 'white', p: '5px' }}
                    />
                  }
                  endIcon={
                    <Typography variant="p" sx={{ fontSize: '0.875rem !important' }}>
                      <span role="img" aria-label="">
                        🔥
                      </span>
                      Popular
                    </Typography>
                  }
                  className={classes.iconAbsolute1}
                  fullWidth
                  onClick={() => {
                    connectWithEssential();
                  }}
                  sx={!isLight && { backgroundColor: 'white' }}
                >
                  Elastos Essentials
                </ButtonStyle>
              </Grid>
              <Grid item xs={12}>
                <ButtonOutlinedStyle variant="outlined" fullWidth onClick={handleClickOpenDownloadEssentialDlg}>
                  I don’t have a wallet
                </ButtonOutlinedStyle>
              </Grid>
            </Grid>
          </Box>
          <Typography
            variant="caption"
            display="block"
            sx={{ color: 'text.secondary' }}
            gutterBottom
            align="center"
          >
            We do not own your private keys and cannot access your funds without your confirmation.
          </Typography>
        </DialogContent>
      </Dialog>
      <Dialog open={openDownloadEssential} onClose={handleCloseDownloadEssentialDlg}>
        <DialogTitle>
          <IconButton
            aria-label="close"
            onClick={handleCloseDownloadEssentialDlg}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500]
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography variant="h3" component="div" sx={{ color: 'text.primary' }} align="center">
            Download Essentials
          </Typography>
          <Typography variant="p" component="div" sx={{ color: 'text.secondary' }} align="center">
            A DID is required in order to create or sell items on Pasar. Get your own DID by downloading the Elastos Essentials mobile app now!
          </Typography>
          <Typography variant="body2" display="block" gutterBottom align="center" sx={{ mt: 4 }}>
            Web3.0 super wallet with Decentralized Identifier (DID)
          </Typography>
          <Box component="div" sx={{ maxWidth: 300, m: 'auto' }}>
            <Grid container spacing={2} sx={{ mt: 2, mb: 4 }}>
              <Grid item xs={12} sx={{ pt: '8px !important' }}>
                <ButtonStyle
                  variant="contained"
                  href="https://play.google.com/store/apps/details?id=org.elastos.essentials.app"
                  target="_blank"
                  startIcon={<AdbIcon />}
                  className={classes.iconAbsolute2}
                  fullWidth
                >
                  Google Play
                </ButtonStyle>
              </Grid>
              <Grid item xs={12}>
                <ButtonOutlinedStyle
                  variant="outlined"
                  href="https://apps.apple.com/us/app/elastos-essentials/id1568931743"
                  target="_blank"
                  startIcon={<AppleIcon />}
                  className={classes.iconAbsolute2}
                  fullWidth
                >
                  App Store
                </ButtonOutlinedStyle>
              </Grid>
              <Grid item xs={12} align="center">
                <Button color="inherit" startIcon={<Icon icon={arrowIosBackFill} />} onClick={handleGoBackEssential}>
                  Go back
                </Button>
              </Grid>
            </Grid>
          </Box>
          <Typography variant="caption" display="block" sx={{ color: 'text.secondary' }} gutterBottom align="center">
            We do not own your private keys and cannot access your funds without your confirmation.
          </Typography>
        </DialogContent>
      </Dialog>
      <SnackbarCustom isOpen={isOpenSnackbar} setOpen={setSnackbarOpen}>
        Wrong network, only Elastos Smart Chain is supported
      </SnackbarCustom>
    </>
  );
}