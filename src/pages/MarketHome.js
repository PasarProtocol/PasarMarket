// material
import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import { Box, Container, Stack, Grid, Typography, Button, Card } from '@mui/material';
import AdbIcon from '@mui/icons-material/Adb';
import AppleIcon from '@mui/icons-material/Apple';
// components
import Page from '../components/Page';
import HomeAssetCard from '../components/HomeAssetCard';
import { MotionInView, varFadeInUp, varFadeInDown } from '../components/animate';
// ----------------------------------------------------------------------

const RootStyle = styled(Page)(({ theme }) => ({
  background: 'black',
  paddingTop: theme.spacing(8),
  paddingBottom: theme.spacing(12),
  [theme.breakpoints.up('md')]: {
    paddingTop: theme.spacing(11)
  },
  [theme.breakpoints.down('md')]: {
    paddingBottom: theme.spacing(3)
  }
}));
const StackStyle = styled(Stack)(({ theme }) => ({
  flexDirection: 'row',
  [theme.breakpoints.up('sm')]: {
    '& .MuiPaper-root': {
      width: '30%',
      height: '100%',
      minWidth: '300px'
    }
  },
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
    '& .MuiPaper-root': {
      marginTop: theme.spacing(2)
    }
  }
}));
const CardStyle = styled(Card)(({ theme }) => ({
  backgroundColor: '#0d0d0d',
  padding: theme.spacing(4),
  marginBottom: theme.spacing(4),
  display: 'flex',
  [theme.breakpoints.up('sm')]: {
    flexDirection: 'row',
    '& img': {
      marginTop: theme.spacing(8),
      marginLeft: theme.spacing(2),
      width: '25%',
      height: '100%',
    }
  },
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
    '& img': {
      margin: '32px auto 32px'
    }
  },
  '& div.MuiBox-root': {
    minWidth: 0,
    flexGrow: 1,
    position: 'relative',
    [theme.breakpoints.up('sm')]: {
      paddingBottom: 48
    }
  }
}));

const TitleStyle = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  lineHeight: 64 / 48,
  fontSize: '2rem',
  '@media (min-width:600px)': {
    fontSize: '2.3rem'
  },
  '@media (min-width:900px)': {
    fontSize: '2.5rem'
  },
  '@media (min-width:1200px)': {
    fontSize: '2.7rem'
  }
}));

const OutlineBtnStyle = styled(Button)(({ theme }) => ({
  color: theme.palette.origin.main,
  borderColor: theme.palette.origin.main,
  "&:hover": {
    color: 'white',
    background: theme.palette.origin.main
  }
}));
// ----------------------------------------------------------------------

export default function MarketHome() {
  React.useEffect(() => {
  }, []);

  return (
    <RootStyle title="Explorer | PASAR">
      <Box draggable = {false} component="img" src="/static/corner-logo.png" sx={{ width: '50%', maxWidth: '550px', position: 'absolute', top: 0, right: 0 }} />
      <Container sx={{pt: 4, mb: '100px', position: 'relative'}}>
        <StackStyle>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h1">
              Dawn of the DeMKT
            </Typography>
            <Typography variant="h4" component="div" sx={{fontWeight: 'normal', pb: 3}}>
              Pasar is an open-sourced, community-centric, and one
              of the first truly Web3 decentralized marketplace (DeMKT)
              for exchanging data and Non-fungible Tokens (NFTs)
              as valuable assets.
            </Typography>
            <Stack spacing={1} direction="row">
              <OutlineBtnStyle to="/marketplace" variant="outlined" component={RouterLink}>
                Go to App
              </OutlineBtnStyle>
              <Button to="/create" variant="contained" component={RouterLink} color="inherit">
                Create
              </Button>
            </Stack>
          </Box>
          <HomeAssetCard/>
        </StackStyle>
      </Container>
      <Container maxWidth="md">
        <MotionInView variants={varFadeInUp}>
          <CardStyle>
            <Box component="div" sx={{pb:'0 !important'}}>
              <TitleStyle component="h1">
                Get started with Essentials
              </TitleStyle>
              <Typography variant="p" component="div" sx={{color: 'text.secondary'}}>
                Easy onboarding to set up decentralized identifier (DID) and wallet from
                Elastos Essentials Super Wallet.<br/>
                <br/>
                Discover Elastos’ Web3.0 technology stacks all in a single app such as
                DID, decentralized personal storage, multiple blockchains support
                (BTC, ETH, ELA ,BSC, etc.), Decentralized Autonomous Organization (DAO)
                and so much more!
              </Typography>
              <Stack spacing={1} direction="row" sx={{mt: 2}}>
                <OutlineBtnStyle variant="outlined" href="#" startIcon={<AdbIcon />}>
                  Google Play
                </OutlineBtnStyle>
                <Button variant="contained" href="#" startIcon={<AppleIcon />} color="inherit">
                  App Store
                </Button>
              </Stack>
            </Box>
            <Box draggable = {false} component="img" src="/static/essentials.png" sx={{mt: '0 !important'}} />
          </CardStyle>
        </MotionInView>
        <MotionInView variants={varFadeInUp}>
          <CardStyle>
            <Box component="div">
              <TitleStyle component="h1">
                Decentralized Marketplace (DeMKT)
              </TitleStyle>
              <Typography variant="p" component="div" sx={{color: 'text.secondary'}}>
                Pasar is a truly decentralized marketplace which means there is no centralserver nor entity to facilitate the peer-to-peer trading of data and NFTs.<br/>
                <br/>
                Items cannot be censored, blocked nor taken down by Pasar due to
                it being a decentralized marketplace. The trust based system protocol will
                accelerate Pasar to become the next leader of Web3 DeMKT.
              </Typography>
            </Box>
            <Box draggable = {false} component="img" src="/static/market-home.svg" sx={{p: {xs: '0px 32px 32px', sm: 0}}} />
            <Stack spacing={1} direction="row" sx={{position: 'absolute', bottom: 32, mr: 4}}>
              <OutlineBtnStyle variant="outlined" href="#">
                Marketplace
              </OutlineBtnStyle>
              <Button variant="contained" href="#" color="inherit">
                Explorer
              </Button>
            </Stack>
          </CardStyle>
        </MotionInView>
        <MotionInView variants={varFadeInUp}>
          <CardStyle>
            <Box component="div">
              <TitleStyle component="h1">
                Decentralized Identity (DID)
              </TitleStyle>
              <Typography variant="p" component="div" sx={{color: 'text.secondary'}}>
                DID empowers users to be self-sovereign of our own personal data.Users are required to sign in with DID in order to create or sell items on Pasar.<br/>
                However, users can still purchase items by just connecting their wallets
                without a DID.<br/>
                <br/>
                A reputation system based on DID will enable a user to be trusted by the
                community instead of using the traditional verification system through
                central authorities.
              </Typography>
            </Box>
            <Box draggable = {false} component="img" src="/static/user-home.svg" sx={{p: {xs: '0px 32px 32px', sm: 0}}} />
            <Stack spacing={1} direction="row" sx={{position: 'absolute', bottom: 32, mr: 4}}>
              <OutlineBtnStyle variant="outlined" href="#">
                Sign in with DID
              </OutlineBtnStyle>
              <Button variant="contained" href="#" color="inherit">
                Learn  more about DID
              </Button>
            </Stack>
          </CardStyle>
        </MotionInView>
        <MotionInView variants={varFadeInUp}>
          <CardStyle>
            <Box component="div">
              <TitleStyle component="h1">
                Elastos Smart Chain (ESC)
              </TitleStyle>
              <Typography variant="p" component="div" sx={{color: 'text.secondary'}}>
                ESC is a programmable smart-contract blockhchain component of Elastos. 
                Pasar is built on ESC because of its ability to conduct fast transactions
                efficiently with fees next to nothing.<br/>
                <br/>
                Users can purchase ELA on smart chain through the Essentials
                app from Glide Finance, a decentralized exchange (DEX) also
                built on the Elastos Smart Chain (ESC).
              </Typography>
            </Box>
            <Box draggable = {false} component="img" src="/static/chain-home.svg" sx={{p: {xs: '0px 32px 32px', sm: 0}}} />
            <Stack spacing={1} direction="row" sx={{position: 'absolute', bottom: 32, mr: 4}}>
              <OutlineBtnStyle variant="outlined" href="#">
                Get ELA 
              </OutlineBtnStyle>
              <Button variant="contained" href="#" color="inherit">
                Learn more about ESC
              </Button>
            </Stack>
          </CardStyle>
        </MotionInView>
        <Box draggable = {false} component="img" src="/static/elastos-logo.svg" sx={{m: 'auto', width: '40%'}}/>
      </Container>
    </RootStyle>
  );
}