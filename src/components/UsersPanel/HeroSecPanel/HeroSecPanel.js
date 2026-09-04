"use client";
import React, { useState } from "react";
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import { FiChevronLeft } from "react-icons/fi";


export default function HeroSecPanel() {

  const breadcrumbs = [
    <Link underline="hover" key="1" href="/">
      <span className="md:text-[15px] xs:text-[10px] text-[#60697F]">
        ویراکو
      </span>
    </Link>,
    <Typography key="2" sx={{ color: 'text.primary' }}>
      <span className="md:text-[15px] xs:text-[10px] text-black">
      پنل کاربری 
      </span>
    </Typography>,
  ];


  return (
    <section dir="rtl" className="h-auto">
      <div className="bgheaderpro md:h-[102px] xs:h-[80px]">
      </div>
      <div dir="rtl" className="md:mt-8 xs:mt-4 md:w-[90%] xs:w-[95%] mx-auto">
          <Stack spacing={2}>
            <Breadcrumbs
              separator={<FiChevronLeft className="text-[#60697F] md:text-[20px] xs:text-[10px]"/>}
              aria-label="breadcrumb"
            >
              {breadcrumbs}
            </Breadcrumbs>
          </Stack>
      </div>
    </section>
  );
}