"use client"
import React, { createContext, useContext, useState , useEffect } from "react"
import { getAllContent } from "@/lib/api/content"
import { useLanguage } from "./LanguageContext"
const MatnContext = createContext()

export const MatnProvider = ({ children }) => {
  const { locale } = useLanguage()
  const [textaslifa, settextaslifa] = useState('')

  useEffect(() => {
    getAllContent()
      .then((contents) => {
        const aboutItem = contents.find(c => c.key === "about-us" || c.page === "aboutus")
        if (aboutItem) {
          const bodyText = typeof aboutItem.body === 'object' ? (aboutItem.body[locale] || aboutItem.body.fa || '') : (aboutItem.body || '')
          settextaslifa(bodyText)
        }
      })
      .catch((error) => {
        console.error("Content fetch error in MatnContext:", error)
      })
  }, [locale])

  return (
    <MatnContext.Provider value={{ textaslifa }}>
      {children}
    </MatnContext.Provider>
  )
}

export const useMatn = () => useContext(MatnContext)
