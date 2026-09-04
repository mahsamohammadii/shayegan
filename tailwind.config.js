export default {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        bgbox: '#14213D',
        btn: '#FCA311',
        borderbox:'#E5E5E5',
        textcolor1:'#474747',
        textcolor2:'#4d5156'
      },
      width: {
        navad:'90%',
      },
      height:{
        boximg:'158px',
      },
      margin: {
        left:'5%',
        main:'35px'
      },
      padding:{
        left:'2%',
      },
      fontSize:{
        fontone:'10px',
        fonttwo:'12px',
        fontthree:'15px',
        fontfour:'18px',
        fontfive:'20px',
        fontsix:'25px',
        fontseven:'30px'
      },
      screens: {  
              'sm':'0px',     
              'md': '900px',
              'lg': '1200px',
      },
      backgroundImage: {
        gradientback: 'linear-gradient(180deg, #00FFA330 0%, #06906210 42% , #0D1117 100%)',
        gradienttext: 'linear-gradient(180deg, #00FFA350 0%, #00FFA3 100%)',
        gradientbtnborder: 'linear-gradient(180deg, #161D2510 0%, #161D25 100%)',
        gradientbtnbacksame: 'linear-gradient(350deg, #004E32 0%, #00B17174 49% , #00FFA3 100%)',
      },

    }
  },
  plugins: []
}

