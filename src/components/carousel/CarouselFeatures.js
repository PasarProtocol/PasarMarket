import React, { useRef } from 'react';
import Slider from 'react-slick';
import PropTypes from 'prop-types';
import { Link as RouterLink, useParams } from 'react-router-dom';
// material
import { makeStyles } from "@mui/styles";
import { useTheme, styled } from '@mui/material/styles';
import { Box, Stack, Typography, Link, Table, TableBody, TableRow, TableCell } from '@mui/material';
import { Icon } from '@iconify/react';
import checkCircleFillIcon from '@iconify-icons/akar-icons/circle-check-fill';
import checkCircleOutlineIcon from '@iconify-icons/akar-icons/circle-check';
import crossCircleFillIcon from '@iconify-icons/akar-icons/circle-x-fill';
import crossCircleOutlineIcon from '@iconify-icons/akar-icons/circle-x';
//
import DIABadge from '../DIABadge';
import { CarouselControlsPaging2 } from './controls';
import { getTime, reduceHexAddress } from '../../utils/common';

// ----------------------------------------------------------------------
const RootStyle = styled('div')(({ theme }) => ({
  position: 'relative',
  '& .slick-list': {
  }
}));

const CheckIcon = ({isSupported, selected=false})=>{
  if (typeof isSupported === 'string') {
    return <Typography variant='body2' align="center" sx={{px: 2}} color={selected?'origin.main':'text.primary'}>{isSupported}</Typography>
  }
  if(isSupported)
   return <Box sx={{color: 'origin.main', textAlign: 'center'}}><Icon icon={selected?checkCircleFillIcon:checkCircleOutlineIcon} width={24}/></Box>
  return <Box sx={{color: 'text.secondary', textAlign: 'center'}}><Icon icon={selected?crossCircleFillIcon:crossCircleOutlineIcon} width={24}/></Box>
}
const SelectedTitleStyle = styled(Typography)(({ theme }) => ({
  backgroundImage: 'linear-gradient(90deg, #FF5082, #a951f4)',
  backgroundSize: '100%',
  backgroundRepeat: 'repeat',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  MozBackgroundClip: 'text',
  MozTextFillColor: 'transparent',
  display: 'inline',
  [theme.breakpoints.up('xs')]: {
    fontSize: '1.85rem'
  },
  [theme.breakpoints.up('sm')]: {
    fontSize: '2rem'
  },
  [theme.breakpoints.up('md')]: {
    fontSize: '2.2rem'
  },
  [theme.breakpoints.up('lg')]: {
    fontSize: '2.4rem'
  },
}))
// ----------------------------------------------------------------------
const DiaBadgeTypes = [
  {name: 'BASIC', range: 'Hold 0 DIA (no badge) or less than 0.01 DIA'},
  {name: 'BRONZE', range: 'Hold more than 0.01 DIA but less than 0.1 DIA'},
  {name: 'SILVER', range: 'Hold more than 0.1 DIA but less than 1 DIA'},
  {name: 'GOLD', range: 'Hold more than 1 DIA'}
]

const styles = {
  header: {
    width: '100%',
    border: 1,
    borderLeft: 0,
    borderColor: (theme)=>theme.palette.divider,
    p: 1,
    mt: 0
  },
  selectedHeader: {
    width: '100%',
    border: 3,
    borderTopLeftRadius: '1em',
    borderTopRightRadius: '1em',
    borderColor: (theme)=>theme.palette.origin.main,
    backgroundColor: (theme)=>theme.palette.grey[theme.palette.mode==='light'?300:700],
    p: 1,
    mt: -2
  },
  td: {
    borderRight: 1,
    borderColor: (theme)=>theme.palette.divider
  },
  selectedTd: {
    border: 3,
    borderTop: 0,
    borderColor: (theme)=>theme.palette.origin.main,
    backgroundColor: (theme)=>theme.palette.grey[theme.palette.mode==='light'?300:700],
  }
}

CarouselItem.propTypes = {
  page: PropTypes.array
};

function CarouselItem({ index, headerRef, body, selected=false }) {
  const {name, range} = DiaBadgeTypes[index]
  return (
    <Stack sx={{overflow: 'hidden', pt: 3}}>
      <Box 
        className={selected?'selected':''}
        sx={selected?styles.selectedHeader:styles.header}
        ref={headerRef[index]}
      >
        <Stack sx={{alignItems: 'center', mt: 1}} spacing={2}>
          <DIABadge degree={index} disableTooltip={Boolean(true)} zoomRate={selected?1.6:1.4}/>
          {
            selected?
            <SelectedTitleStyle variant="h3">{name}</SelectedTitleStyle>:
            <Typography variant="h3" align="center">{name}</Typography>
          }
          <Typography variant={selected?'subtitle1':'body2'} align="center">{range}</Typography>
        </Stack>
      </Box>
      <Table sx={{marginLeft: '-170px', width: 'inherit', borderBottom: selected?0:1, borderColor: (theme)=>theme.palette.divider, borderCollapse: 'separate'}}>
        <TableBody>
          {body}
        </TableBody>
      </Table>
    </Stack>
  )
}

export default function CarouselFeatures(props) {
  const { featureArray } = props
  const theme = useTheme();
  const carouselRef = useRef();
  const caseRef = useRef();
  const bottomTitleRef = useRef();
  const headerRef = [useRef(), useRef(), useRef(), useRef()]
  const bottomRef = [useRef(), useRef(), useRef(), useRef()]
  const selectedDegree = 0;
  const settings = {
    dots: true,
    arrows: false,
    autoplay: false,
    slidesToShow: 3,
    slidesToScroll: 1,
    infinite: false,
    rtl: Boolean(theme.direction === 'rtl'),
    responsive: [
      {
        breakpoint: 900,
        settings: {
          slidesToShow: 3,
        }
      },
      {
        breakpoint: 700,
        settings: {
          slidesToShow: 2,
        }
      },
      {
        breakpoint: 500,
        settings: {
          slidesToShow: 1,
        }
      }
    ],
    ...CarouselControlsPaging2({
      sx: { mt: 3 }
    })
  };
  
  const matchCasebarGap = ()=>{
    if(!caseRef.current)
      return
    headerRef.forEach((item)=>{
      item.current.style.height = 'initial'
    })
    const maxHeaderCellHeight = Math.max(...(headerRef.map((item)=>item.current.clientHeight)))
    caseRef.current.style.paddingTop = `${maxHeaderCellHeight+1}px`
    headerRef.forEach((item)=>{
      const isSelected = item.current.getAttribute('class').includes('selected')
      const headerCellHeight = isSelected?maxHeaderCellHeight+17:maxHeaderCellHeight+1
      item.current.style.height = `${headerCellHeight}px`
    })
    // console.log(maxHeaderCellHeight, headerRef, headerRef.map((item)=>item.current.clientHeight))
  }

  const matchBottomHeight = ()=>{
    if(!bottomTitleRef.current)
      return
    bottomRef.forEach((item)=>{
      item.current.style.height = 'initial'
    })
    const maxBottomCellHeight = Math.max(...(bottomRef.map((item)=>item.current.clientHeight)))
    bottomTitleRef.current.style.height = `${maxBottomCellHeight+1}px`
    bottomRef.forEach((item)=>{
      const isSelected = item.current.getAttribute('class').includes('selected')
      const bottomCellHeight = isSelected?maxBottomCellHeight+17:maxBottomCellHeight+1
      item.current.style.height = `${bottomCellHeight}px`
    })
    // console.log(maxBottomCellHeight, bottomRef, bottomRef.map((item)=>item.current.clientHeight))
  }
  React.useEffect(()=>{
    matchCasebarGap()
    matchBottomHeight()
  }, [])
  window.addEventListener('resize', ()=>{
    matchCasebarGap()
    matchBottomHeight()
  })

  const titleWidth = 170
  const bodyTRs = featureArray.reduce((trs, feature, _i)=>{
    const isLastItem = _i===(featureArray.length-1)
    trs.caseBar.push(
      <TableRow key={_i}>
        <TableCell ref={isLastItem?bottomTitleRef:null} sx={{color: 'white'}}>{feature.title}</TableCell>
      </TableRow>
    )
    trs.content.forEach((_, _j)=>{
      trs.content[_j].push(
        <TableRow key={_j}>
          <TableCell sx={{opacity: 0, width: titleWidth, px: 3}}>{feature.title}</TableCell>
          <TableCell
            className={selectedDegree===_j?'selected':''}
            ref={isLastItem?bottomRef[_j]:null}
            sx={
              selectedDegree===_j?
              {
                ...styles.selectedTd, 
                ...(isLastItem?{borderBottomLeftRadius: '1em', borderBottomRightRadius: '1em'}:{borderBottom: 0})
                
              }:
              styles.td
            }>
            <CheckIcon isSupported={feature.allow[_j]} selected={selectedDegree===_j}/>
          </TableCell>
        </TableRow>
      )
    })
    return trs
  }, {caseBar: [], content: [[], [], [], []]})
  
  return (
    <RootStyle>
        <Box ref={caseRef} sx={{width: 170, position: 'absolute', mt: 3, boxShadow: '1px 0px 0px rgba(145, 158, 171, 0.24)'}}>
          <Table sx={{borderTopLeftRadius: '1em', borderBottomLeftRadius: '1em', bgcolor: 'origin.main'}}>
            <TableBody>
              {bodyTRs.caseBar}
            </TableBody>
          </Table>
        </Box>
        <Box sx={{pl: '170px'}}>
          <Slider ref={carouselRef} {...settings}>
            {Array(4).fill(0).map((_, _i) => (
              <CarouselItem key={_i} index={_i} headerRef={headerRef} body={bodyTRs.content[_i]} selected={_i===0}/>
            ))}
          </Slider>
        </Box>
    </RootStyle>
  );
}