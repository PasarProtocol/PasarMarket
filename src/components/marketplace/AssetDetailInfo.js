import { Link as RouterLink } from 'react-router-dom';
import PropTypes from 'prop-types';
import { Box, Stack, Typography, Link } from '@mui/material';
import CopyButton from '../CopyButton';
import { getTime, reduceHexAddress } from '../../utils/common';
import { MAIN_CONTRACT } from '../../config';

// ----------------------------------------------------------------------

const DETAILINFO_ICONS = ['hash', 'cash-hand', 'basket', 'tag', 'calendar-hammer', 'calendar-market', 'qricon'];
const DETAILINFO_TITLE = [
  'Token ID',
  'Royalties',
  'Quantity',
  'Sale Type',
  'Created Date',
  'Date on Market',
  'Item Type'
];
const DETAILINFO_KEYS = ['tokenIdHex', 'royalties', 'quantity', 'SaleType', 'createTime', 'marketTime', 'type'];

// ----------------------------------------------------------------------
const DetailItem = (props) => {
  const { item, isLast, value } = props;
  const { icon, title } = item;
  let displayValue = value;
  if (value) {
    if (item.key === 'type') displayValue = value.charAt(0).toUpperCase().concat(value.substring(1));
    if (item.key === 'tokenIdHex') displayValue = reduceHexAddress(value);
  }
  const sx = isLast
    ? {}
    : { borderBottom: '1px solid', borderColor: (theme) => `${theme.palette.grey[500_32]}`, pb: 1 };
  const iconSrc = `/static/${icon}.svg`;
  return (
    <Stack direction="row" alignItems="center" spacing={2} sx={sx}>
      <Box
        component="img"
        alt={title}
        src={iconSrc}
        sx={{ width: 48, height: 48, borderRadius: 1, mr: 2, background: '#bdbdbd', padding: '14px' }}
      />
      <Box sx={{ minWidth: 0, flexGrow: 1 }}>
        <Typography color="inherit" variant="subtitle2" noWrap>
          {title}
        </Typography>
        <Stack sx={{ flexDirection: 'row' }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }} noWrap>
            {title === 'Creator' || title === 'Owner' ? (
              <Link to={`/explorer/transaction/detail/${value}`} component={RouterLink}>
                {displayValue}
              </Link>
            ) : (
              displayValue
            )}
          </Typography>
          {title === 'Token ID' && value && <CopyButton text={value} />}
        </Stack>
      </Box>
    </Stack>
  );
};

DetailItem.propTypes = {
  item: PropTypes.any,
  isLast: PropTypes.bool,
  value: PropTypes.any
};

AssetDetailInfo.propTypes = {
  detail: PropTypes.any
};

export default function AssetDetailInfo({ detail }) {
  const infoItems = DETAILINFO_TITLE.map((title, index) => ({
    title,
    icon: DETAILINFO_ICONS[index],
    key: DETAILINFO_KEYS[index]
  }));
  const creatimestamp = getTime(detail.createTime);
  const marketimestamp = getTime(detail.marketTime);
  let dateOnMarket = detail.DateOnMarket;
  if (dateOnMarket !== 'Not on sale') {
    const timestamp = getTime(dateOnMarket);
    dateOnMarket = `${timestamp.date} ${timestamp.time}`;
  }

  const checkIfHolderIsMarket = Object.values(MAIN_CONTRACT).findIndex((item) => item.market === detail.holder);
  const detailInfo = {
    ...detail,
    royalties: `${(detail.royalties * 100) / 10 ** 6} %`,
    createTime: `${creatimestamp.date} ${creatimestamp.time}`,
    marketTime: `${marketimestamp.date} ${marketimestamp.time}`,
    dateOnMarket,
    holder: checkIfHolderIsMarket < 0 ? detail.holder : detail.royaltyOwner
  };

  return (
    <Stack spacing={1} sx={{ pt: 1, pb: '35px' }}>
      {infoItems.map((item, index) => (
        <DetailItem key={index} item={item} value={detailInfo[item.key]} isLast={index === infoItems.length - 1} />
      ))}
    </Stack>
  );
}
