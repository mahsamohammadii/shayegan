"use client"
import React, { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { BiRightArrowAlt, BiLeftArrowAlt, BiTrash } from "react-icons/bi";
import Footer2 from "../layout/Footer2";
import { useLanguage } from "../../app/contexts/LanguageContext"
import { useMatn } from "../../app/contexts/MatnContext"
import LoadingBox from "../layout/LoadingBox";
import { AiOutlineClose } from "react-icons/ai";
import { FaHeart, FaRegHeart, FaCheckCircle, FaExclamationCircle } from "react-icons/fa";
import { FiShare2 } from "react-icons/fi";
import { getProductBySlug, getProductOptions, getProducts, getMinPrice } from "../../lib/api/products";
import { useLogin } from "@/app/contexts/LoginContext";
import { useCart } from "@/app/contexts/CartContext";
import { getCart, addItemToCart, updateCartItem, deleteCartItem } from "@/lib/api/cart";

function ProductContent({ slugParam, src, zoom = 3 }) {
    let domain = "https://api.shayegandesign.com";
    const { locale } = useLanguage()
    const { textaslifa } = useMatn()
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();

    // Determine active product slug
    const paramSlug = params?.slug ? (Array.isArray(params.slug) ? params.slug[0] : params.slug) : null;
    const searchSlug = searchParams ? (searchParams.get('slug') || searchParams.get('uuid')) : null;
    const slug = slugParam || paramSlug || searchSlug || 'parsian-l-sofa';

    const [datas, setdatas] = useState({
        id: null,
        slug: "",
        nameFa: "",
        nameEn: "",
        descFa: "",
        descEn: "",
        color: "#ffffff",
        basePrice: 0,
    })

    const [axes, setAxes] = useState([]);
    const [variants, setVariants] = useState([]);
    const [selectedOptions, setSelectedOptions] = useState({});
    const [currentVariant, setCurrentVariant] = useState(null);
    const [price, setPrice] = useState(0);

    const [features, setfeatures] = useState([])
    const [products, setproducts] = useState([])
    const [gallery, setgallery] = useState([])
    const [selectedImage, setSelectedImage] = useState("");
    const [loadproduct, setloadproduct] = useState(true);

    const { isLoggedIn, getValidToken } = useLogin();
    const { refreshCart, triggerCartHint } = useCart();
    const [cartItemId, setCartItemId] = useState(null);
    const [matchingItemStock, setMatchingItemStock] = useState(null);
    const [cartToast, setCartToast] = useState(null);
    const [cartLoading, setCartLoading] = useState(false);

    const [openModal, setopenModal] = useState(false);
    const [addbtn, setaddbtn] = useState(0);
    const [proCount, setproCount] = useState(0);

    useEffect(() => {
        let isCancelled = false;
        async function syncCartItem() {
            if (!datas.id) return;
            try {
                const token = await getValidToken();
                if (!token) {
                    if (!isCancelled) {
                        setCartItemId(null);
                        setproCount(0);
                        setaddbtn(0);
                        setMatchingItemStock(null);
                    }
                    return;
                }
                const cart = await getCart(token);
                if (isCancelled || !cart) return;

                const activeSku = currentVariant?.sku || currentVariant?.id || currentVariant?._id || datas.sku || 'DEFAULT-SKU';
                const matchingItem = cart.items?.find(it => 
                    (it.productId === datas.id || it.product?._id === datas.id || it.product?.slug === datas.slug) && 
                    (it.sku === activeSku || !activeSku)
                );

                if (matchingItem) {
                    setCartItemId(matchingItem._id);
                    setproCount(matchingItem.quantity);
                    setaddbtn(1);
                    const itStock = matchingItem.variant?.stock ?? matchingItem.product?.stock ?? null;
                    setMatchingItemStock(itStock !== null && itStock !== undefined ? Number(itStock) : null);
                } else {
                    setCartItemId(null);
                    setproCount(0);
                    setaddbtn(0);
                    setMatchingItemStock(null);
                }
            } catch (err) {
                console.error("Cart sync error:", err);
            }
        }
        syncCartItem();
        return () => { isCancelled = true; };
    }, [datas.id, datas.slug, currentVariant, isLoggedIn, getValidToken]);

    const handleAddToCart = async () => {
        // Stock check before adding
        const variantStock = (currentVariant?.stock !== undefined && currentVariant?.stock !== null)
            ? Number(currentVariant.stock)
            : (currentVariant?.quantity !== undefined && currentVariant?.quantity !== null)
            ? Number(currentVariant.quantity)
            : (currentVariant?.inventory !== undefined && currentVariant?.inventory !== null)
            ? Number(currentVariant.inventory)
            : undefined;

        const mainStock = datas.stock !== undefined && datas.stock !== null ? Number(datas.stock) : undefined;
        const effectiveStock = variantStock ?? mainStock;

        if (effectiveStock !== undefined && effectiveStock <= 0) {
            setCartToast({ 
                type: "error", 
                message: locale === "fa" 
                    ? "موجودی محصول کمتر از تعداد درخواستی شماست." 
                    : "Not enough stock for this item." 
            });
            setTimeout(() => setCartToast(null), 4000);
            return;
        }

        setCartLoading(true);
        try {
            const token = await getValidToken();
            if (!token) {
                setCartToast({ type: "error", message: locale === "fa" ? "برای افزودن محصول به سبد خرید ابتدا باید وارد شوید." : "Please log in to add items to cart." });
                setTimeout(() => {
                    setCartToast(null);
                    router.push('/login');
                }, 1500);
                return;
            }

            const productId = datas.id;
            const activeSku = currentVariant?.sku || currentVariant?.id || currentVariant?._id || datas.sku || 'DEFAULT-SKU';

            const cartData = await addItemToCart(token, { productId, sku: activeSku, quantity: 1 });
            const addedItem = cartData?.items?.find(it => (it.productId === productId || it.product?._id === productId) && it.sku === activeSku);
            
            if (addedItem) {
                setCartItemId(addedItem._id);
                const itStock = addedItem.variant?.stock ?? addedItem.product?.stock ?? null;
                setMatchingItemStock(itStock !== null && itStock !== undefined ? Number(itStock) : null);
            }
            setaddbtn(1);
            setproCount(1);
            setopenModal(true);
            setCartToast({ type: "success", message: locale === "fa" ? "محصول با موفقیت به سبد خرید اضافه شد" : "Added to basket successfully" });
            setTimeout(() => setCartToast(null), 3000);
            await refreshCart();
            triggerCartHint();
        } catch (err) {
            console.error("Error adding to cart:", err);
            const isStockError = err?.status === 400 || 
                                 err?.data?.message?.toLowerCase()?.includes("stock") || 
                                 err?.message?.toLowerCase()?.includes("stock") || 
                                 err?.data?.message?.includes("موجودی") || 
                                 err?.message?.includes("موجودی");
            const msg = isStockError 
                ? (locale === "fa" ? "موجودی محصول کمتر از تعداد درخواستی شماست." : "Not enough stock for this item.")
                : (err.message || (locale === "fa" ? "خطا در افزودن به سبد خرید" : "Failed to add to basket"));
            setCartToast({ type: "error", message: msg });
            setTimeout(() => setCartToast(null), 4000);
        } finally {
            setCartLoading(false);
        }
    };

    const handleIncreaseQty = async () => {
        const newQty = proCount + 1;
        
        // Find effective stock limit for current sku/variant
        const variantStock = (currentVariant?.stock !== undefined && currentVariant?.stock !== null)
            ? Number(currentVariant.stock)
            : (currentVariant?.quantity !== undefined && currentVariant?.quantity !== null)
            ? Number(currentVariant.quantity)
            : (currentVariant?.inventory !== undefined && currentVariant?.inventory !== null)
            ? Number(currentVariant.inventory)
            : undefined;

        const itemStock = (matchingItemStock !== null && matchingItemStock !== undefined)
            ? Number(matchingItemStock)
            : undefined;

        const mainStock = (datas?.stock !== undefined && datas?.stock !== null)
            ? Number(datas.stock)
            : undefined;

        const effectiveStock = variantStock ?? itemStock ?? mainStock;

        if (effectiveStock !== undefined && newQty > effectiveStock) {
            setCartToast({ 
                type: "error", 
                message: locale === "fa" 
                    ? "موجودی محصول کمتر از تعداد درخواستی شماست." 
                    : "Not enough stock for this item." 
            });
            setTimeout(() => setCartToast(null), 4000);
            return;
        }

        setCartLoading(true);
        try {
            const token = await getValidToken();
            if (!token) return;
            if (!cartItemId) {
                await handleAddToCart();
                return;
            }
            await updateCartItem(token, cartItemId, { quantity: newQty });
            setproCount(newQty);
            setCartToast({ type: "success", message: locale === "fa" ? "تعداد محصول در سبد خرید ویرایش شد." : "Cart quantity updated." });
            setTimeout(() => setCartToast(null), 3000);
            await refreshCart();
            triggerCartHint();
        } catch (err) {
            console.error("Error increasing cart qty:", err);
            const isStockError = err?.status === 400 || 
                                 err?.data?.message?.toLowerCase()?.includes("stock") || 
                                 err?.message?.toLowerCase()?.includes("stock") || 
                                 err?.data?.message?.includes("موجودی") || 
                                 err?.message?.includes("موجودی");
            const msg = isStockError 
                ? (locale === "fa" ? "موجودی محصول کمتر از تعداد درخواستی شماست." : "Not enough stock for this item.")
                : (err.message || "خطا در ویرایش سبد خرید");
            setCartToast({ type: "error", message: msg });
            setTimeout(() => setCartToast(null), 4000);
        } finally {
            setCartLoading(false);
        }
    };

    const handleDecreaseQty = async () => {
        if (proCount <= 1) {
            await handleDeleteFromCart();
            return;
        }
        const newQty = proCount - 1;
        setCartLoading(true);
        try {
            const token = await getValidToken();
            if (!token || !cartItemId) return;
            await updateCartItem(token, cartItemId, { quantity: newQty });
            setproCount(newQty);
            setCartToast({ type: "success", message: locale === "fa" ? "تعداد محصول در سبد خرید ویرایش شد." : "Cart quantity updated." });
            setTimeout(() => setCartToast(null), 3000);
            await refreshCart();
            triggerCartHint();
        } catch (err) {
            console.error("Error decreasing cart qty:", err);
            setCartToast({ type: "error", message: err.message || "خطا در ویرایش سبد خرید" });
            setTimeout(() => setCartToast(null), 4000);
        } finally {
            setCartLoading(false);
        }
    };

    const handleDeleteFromCart = async () => {
        setCartLoading(true);
        try {
            const token = await getValidToken();
            if (token && cartItemId) {
                await deleteCartItem(token, cartItemId);
            }
            setproCount(0);
            setaddbtn(0);
            setCartItemId(null);
            setCartToast({ type: "info", message: locale === "fa" ? "محصول از سبد خرید حذف شد." : "Item removed from cart." });
            setTimeout(() => setCartToast(null), 3000);
            await refreshCart();
            triggerCartHint();
        } catch (err) {
            console.error("Error deleting cart item:", err);
            setCartToast({ type: "error", message: err.message || "خطا در حذف کالا از سبد خرید" });
            setTimeout(() => setCartToast(null), 4000);
        } finally {
            setCartLoading(false);
        }
    };

    useEffect(() => {
        let isMounted = true;
        setloadproduct(true);

        async function loadProductData() {
            try {
                const [productDetail, optionsDetail] = await Promise.all([
                    getProductBySlug(slug).catch(() => null),
                    getProductOptions(slug).catch(() => null),
                ]);

                if (!isMounted) return;

                const mainProduct = productDetail || optionsDetail || {};

                const faName = mainProduct.name?.fa || (typeof mainProduct.name === 'string' ? mainProduct.name : '') || 'محصول';
                const enName = mainProduct.name?.en || (typeof mainProduct.name === 'string' ? mainProduct.name : '') || 'Product';
                const faDesc = mainProduct.description?.fa || (typeof mainProduct.description === 'string' ? mainProduct.description : '') || '';
                const enDesc = mainProduct.description?.en || (typeof mainProduct.description === 'string' ? mainProduct.description : '') || '';

                // Extract background-color attribute if present
                let bgAttrColor = null;
                if (mainProduct.attributes && Array.isArray(mainProduct.attributes)) {
                    const bgAttr = mainProduct.attributes.find(attr => {
                        const k = (attr.key || attr.slug || attr.name || '').toLowerCase();
                        const labelFa = (attr.label?.fa || attr.name?.fa || attr.label || attr.name || '').toLowerCase();
                        return k === 'background-color' || 
                               k === 'backgroundcolor' || 
                               k === 'bg-color' || 
                               labelFa.includes('پس‌زمینه') || 
                               labelFa.includes('پس زمینه');
                    });

                    if (bgAttr) {
                        if (Array.isArray(bgAttr.values) && bgAttr.values.length > 0) {
                            const val = bgAttr.values[0];
                            bgAttrColor = typeof val === 'string' ? val : (val.value || val.colorHex || val.hex || val.code || null);
                        } else if (typeof bgAttr.values === 'string') {
                            bgAttrColor = bgAttr.values;
                        } else if (bgAttr.value) {
                            bgAttrColor = typeof bgAttr.value === 'string' ? bgAttr.value : (bgAttr.value.hex || bgAttr.value.value || bgAttr.value.colorHex || bgAttr.value.code || null);
                        }
                    }
                }

                const computedBgColor = bgAttrColor || mainProduct.color || '#ffffff';
                const rawStock = mainProduct.stock ?? mainProduct.inventory ?? mainProduct.quantity ?? optionsDetail?.stock;

                setdatas({
                    id: mainProduct._id || mainProduct.productId,
                    slug: mainProduct.slug || slug,
                    nameFa: faName,
                    nameEn: enName,
                    descFa: faDesc,
                    descEn: enDesc,
                    color: computedBgColor,
                    basePrice: mainProduct.basePrice || 0,
                    attributes: mainProduct.attributes || [],
                    stock: rawStock !== undefined && rawStock !== null ? Number(rawStock) : undefined
                });

                // Set Options and Axes
                let availableAxes = [];
                let productVariants = [];
                let defaultVar = null;

                if (optionsDetail) {
                    availableAxes = optionsDetail.axes || [];
                    productVariants = optionsDetail.variants || [];
                    if (optionsDetail.defaultVariantId) {
                        defaultVar = productVariants.find(v => v.id === optionsDetail.defaultVariantId || v._id === optionsDetail.defaultVariantId);
                    }
                    if (!defaultVar && productVariants.length > 0) {
                        defaultVar = productVariants[0];
                    }
                }

                setAxes(availableAxes);
                setVariants(productVariants);

                // Initial Selections
                let initialSelections = {};
                if (defaultVar && defaultVar.selections) {
                    initialSelections = { ...defaultVar.selections };
                } else {
                    availableAxes.forEach(axis => {
                        if (axis.options && axis.options.length > 0) {
                            initialSelections[axis.key] = axis.options[0].value;
                        }
                    });
                }
                setSelectedOptions(initialSelections);
                setCurrentVariant(defaultVar);

                // Display Price
                if (defaultVar && defaultVar.price) {
                    setPrice(defaultVar.price);
                } else if (optionsDetail?.basePrice) {
                    setPrice(optionsDetail.basePrice);
                } else if (mainProduct.basePrice) {
                    setPrice(mainProduct.basePrice);
                }

                // Build Gallery Images
                const imagesList = [];
                // Add main product images
                if (mainProduct.images && Array.isArray(mainProduct.images)) {
                    mainProduct.images.forEach(img => {
                        const url = typeof img === 'string' ? img : (img.url || img.thumbnailUrl);
                        if (url && !imagesList.includes(url)) imagesList.push(url);
                    });
                }
                // Add variant primary images
                productVariants.forEach(v => {
                    const url = v.primaryImage || (v.images && v.images[0]?.url);
                    if (url && !imagesList.includes(url)) imagesList.push(url);
                });

                setgallery(imagesList);

                // Set initial main image
                const initialImg = defaultVar?.primaryImage || (defaultVar?.images && defaultVar.images[0]?.url) || imagesList[0] || 'https://placehold.co/600x600?text=Shayegan';
                setSelectedImage(initialImg);

                // Attributes / Features — exclude background-color & price-based (attrs with price options)
                const featureList = [];
                if (mainProduct.attributes && Array.isArray(mainProduct.attributes)) {
                    mainProduct.attributes.forEach(attr => {
                        const key = (attr.key || attr.slug || attr.name || '').toLowerCase();
                        // Skip background-color attribute
                        if (key === 'background-color' || key === 'backgroundcolor' || key === 'bg-color') return;

                        // Skip price-based attributes (attributes whose values have a price field)
                        const hasPricedValues = Array.isArray(attr.values) && attr.values.some(v => v && typeof v === 'object' && (v.price !== undefined || v.additionalPrice !== undefined));
                        if (hasPricedValues) return;

                        // Get value string
                        const faVal = Array.isArray(attr.values)
                            ? attr.values.map(v => v?.label?.fa || v?.value || v || '').filter(Boolean).join(', ')
                            : (attr.values || '');
                        const enVal = Array.isArray(attr.values)
                            ? attr.values.map(v => v?.label?.en || v?.value || v || '').filter(Boolean).join(', ')
                            : (attr.values || '');

                        // Skip if no value
                        if (!faVal && !enVal) return;

                        featureList.push({
                            feature_fa_name: attr.label?.fa || attr.key || '',
                            feature_en_name: attr.label?.en || attr.key || '',
                            fa_value: faVal,
                            en_value: enVal,
                        });
                    });
                }
                setfeatures(featureList);

                // Load Similar / Catalog Products by Category
                try {
                    const categoryId = mainProduct.categoryId || mainProduct.category?.id || mainProduct.category?._id;
                    const catalogRes = await getProducts({ 
                        categoryId: categoryId || undefined, 
                        limit: 10 
                    });
                    if (catalogRes?.products) {
                        setproducts(catalogRes.products.filter(p => p.slug !== slug && p._id !== (mainProduct._id || mainProduct.productId)));
                    }
                } catch (e) {
                    console.log('Error loading catalog products:', e);
                }

            } catch (err) {
                console.error('Error fetching product data:', err);
            } finally {
                if (isMounted) setloadproduct(false);
            }
        }

        loadProductData();

        return () => {
            isMounted = false;
        };
    }, [slug, locale]);

    // Slider scroll handler for similar products
    const sliderRef = useRef(null);
    const scrollSlider = (direction) => {
        if (sliderRef.current) {
            const scrollAmount = direction === 'left' ? -340 : 340;
            sliderRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    // Handle Option Selection (wood, material/fabric, color, etc.) with smart dependency resolution
    const handleOptionSelect = (axisKey, optionVal, optionObj) => {
        const candidateSelections = { ...selectedOptions, [axisKey]: optionVal };

        // 1. Check if exact combination exists
        let matched = null;
        if (variants && variants.length > 0) {
            matched = variants.find(v => {
                if (!v.selections) return false;
                return Object.keys(candidateSelections).every(k => v.selections[k] === candidateSelections[k]);
            });
        }

        // 2. If exact combination does NOT exist, find best compatible variant with this selected option
        if (!matched && variants && variants.length > 0) {
            const compatibleVariants = variants.filter(v => v.selections && v.selections[axisKey] === optionVal);

            if (compatibleVariants.length > 0) {
                // Find variant with maximum overlap with current selections
                matched = compatibleVariants.reduce((best, curr) => {
                    if (!best) return curr;
                    let bestMatches = 0;
                    let currMatches = 0;
                    Object.keys(selectedOptions).forEach(k => {
                        if (best.selections?.[k] === selectedOptions[k]) bestMatches++;
                        if (curr.selections?.[k] === selectedOptions[k]) currMatches++;
                    });
                    return currMatches > bestMatches ? curr : best;
                }, null) || compatibleVariants[0];
            }
        }

        // 3. Apply matched variant selections, price and image
        if (matched && matched.selections) {
            setSelectedOptions({ ...matched.selections });
            setCurrentVariant(matched);
            if (matched.price) setPrice(matched.price);
            
            const variantImg = matched.primaryImage || (matched.images && matched.images[0]?.url);
            if (variantImg) {
                setSelectedImage(variantImg);
            } else if (optionObj && optionObj.images && optionObj.images.length > 0) {
                setSelectedImage(optionObj.images[0]);
            }
        } else {
            setSelectedOptions(candidateSelections);
            if (optionObj && optionObj.images && optionObj.images.length > 0) {
                setSelectedImage(optionObj.images[0]);
            }
        }
    };

    // Animations
    const container = {
        hidden: {},
        show: {
            transition: {
                staggerChildren: 0.08,
            },
        },
    };
    const wordd = {
        hidden: { y: 100, opacity: 1 },
        show: { y: 0, opacity: 1, transition: { duration: 0.6, ease: "easeOut" } },
    };

    const [descWords, setDescWords] = useState([]);
    const [titleWords, setTitleWords] = useState([]);
    useEffect(() => {
        let description = locale === "fa" ? (datas.descFa || '') : (datas.descEn || '');
        let title = locale === "fa" ? (datas.nameFa || '') : (datas.nameEn || '');
        
        if (description) setDescWords(description.split(" "));
        if (title) setTitleWords(title.split(" "));
    }, [datas, locale]);

    const tableanime = {
        hidden: { opacity: 0, y: 30 },
        show: { opacity: 1, y: 0, transition: { delay: 0.4, duration: 0.6, ease: "easeOut" }},
    };

    const [showLens, setShowLens] = useState(false);
    const [lensPosition, setLensPosition] = useState({ x: 0, y: 0 });
    const imgRef = useRef(null);

    const handleMouseMove = (e) => {
        if (!imgRef.current) return;
        const { top, left } = imgRef.current.getBoundingClientRect();
        const x = e.clientX - left;
        const y = e.clientY - top;

        setLensPosition({ x, y });
        setShowLens(true);
    };

    const handleMouseLeave = () => {
        setShowLens(false);
    };

    // Slider for similar products
    const boxVariant = {
        hidden: { opacity: 0, y: 50 },
        visible: (i) => ({
            opacity: 1,
            y: 0,
            transition: { delay: i * 0.05, duration: 0.6, ease: "easeOut" },
        }),
    };
    const imageVariant = {
        hidden: { scale: 0, opacity: 1 },
        visible: (i) => ({
            opacity: 1,
            scale: 1,
            transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" },
        }),
    };
    const imageVariant2 = {
        hidden: { x: -1000, y: 0, opacity: 0 },
        visible: (i) => ({
            opacity: 1,
            x: 1,
            y: 0,
            transition: { delay: i * 0.5, duration: 2, ease: "easeOut" },
        }),
    };

    const [hoveredIndex, setHoveredIndex] = useState(null);
    const [slideIndex, setSlideIndex] = useState({});
    const [containerWidth, setContainerWidth] = useState(0);

    const [dragX, setDragX] = useState({});
    const startXRef = useRef({});
    const isDraggingX = useRef({});
    const thresholdX = 100;

    const handleDragStartX = (clientX, index) => {
        startXRef.current[index] = clientX;
        isDraggingX.current[index] = true;
    };

    const handleDragMoveX = (clientX, index) => {
        if (!isDraggingX.current[index]) return;
        const diff = (clientX - startXRef.current[index]) * 0.6;
        setDragX(prev => ({ ...prev, [index]: diff }));
    };

    const handleDragEndX = (box, index) => {
        if (!isDraggingX.current[index]) return;

        const current = slideIndex[index] || 0;
        const boxGallery = box.images?.length ? box.images : [{ url: box.primaryImage || '' }];
        const max = boxGallery.length - 1;
        const dx = dragX[index] || 0;

        if (dx < -thresholdX && current < max) {
            setSlideIndex(prev => ({ ...prev, [index]: current + 1 }));
        } else if (dx > thresholdX && current > 0) {
            setSlideIndex(prev => ({ ...prev, [index]: current - 1 }));
        }

        isDraggingX.current[index] = false;
        startXRef.current[index] = null;
        setDragX(prev => ({ ...prev, [index]: 0 }));
    };

    const [isFilled, setIsFilled] = useState(false);
    const toggleHeart = () => {
        setIsFilled(!isFilled);
    };

    const handleShare = () => {
        if (typeof window !== 'undefined' && navigator.share) {
            navigator.share({
                title: locale === 'fa' ? datas.nameFa : datas.nameEn,
                url: window.location.href,
            }).catch((err) => {
                console.error('Error sharing:', err);
            });
        } else {
            alert("مرورگر شما از اشتراک‌گذاری پشتیبانی نمی‌کند.");
        }
    };

    // Summary text for active selections in modal
    const getActiveSelectionsSummary = () => {
        if (!axes || axes.length === 0) return '';
        return axes.map(axis => {
            const val = selectedOptions[axis.key];
            const opt = axis.options?.find(o => o.value === val);
            const label = locale === 'fa' ? (opt?.label?.fa || val) : (opt?.label?.en || val);
            const axisName = locale === 'fa' ? (axis.label?.fa || axis.key) : (axis.label?.en || axis.key);
            return `${axisName}: ${label}`;
        }).filter(Boolean).join(' / ');
    };

    return (
        <>
            {/* Global Toast Alert */}
            {/* <AnimatePresence>
                {cartToast && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        transition={{ duration: 0.25 }}
                        dir={locale === "fa" ? "rtl" : "ltr"}
                        className={`fixed top-24 left-1/2 -translate-x-1/2 z-[250] w-[90%] max-w-md p-4 rounded-2xl text-sm font-medium shadow-2xl flex items-center justify-between border backdrop-blur-md ${
                            cartToast.type === 'error' ? 'bg-red-50/95 border-red-300 text-red-800' :
                            cartToast.type === 'info' ? 'bg-blue-50/95 border-blue-300 text-blue-800' :
                            'bg-emerald-50/95 border-emerald-300 text-emerald-800'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            {cartToast.type === 'error' ? (
                                <FaExclamationCircle className="text-xl text-red-600 shrink-0" />
                            ) : (
                                <FaCheckCircle className="text-xl text-emerald-600 shrink-0" />
                            )}
                            <span className="font-semibold leading-relaxed">{cartToast.message}</span>
                        </div>
                        <button 
                            onClick={() => setCartToast(null)} 
                            className="font-bold text-gray-400 hover:text-black p-1 text-base transition-colors"
                        >
                            ✕
                        </button>
                    </motion.div>
                )}
            </AnimatePresence> */}

            {loadproduct ? <LoadingBox/> :   
            <> 
                <div style={{ background: datas.color || '#ffffff' }}>
                    {/* Section 1 */}
                    <div className="w-full md:h-[85vh] sm:h-auto">
                        <div dir="rtl" className="md:flex sm:block pt-[100px] pb-[50px] gap-5 h-full relative w-[90%] ml-[5%]">
                            <div dir="ltr" className="md:w-3/5 sm:w-full h-full md:flex sm:block gap-2 ">
                                <div className="md:w-4/5 sm:w-full h-calc(100% - 150px)">
                                    <div
                                        className="rounded border border-gray-500 md:p-2 sm:p-1 flex items-center justify-center"
                                        style={{ position: 'relative', width: '100%', minHeight: '300px' }}
                                        onMouseMove={handleMouseMove}
                                        onMouseLeave={handleMouseLeave}
                                    >
                                        <div className="absolute left-3 top-3 z-10">
                                            <button onClick={handleShare} className="cursor-pointer">
                                                <FiShare2 className="text-footert"/>
                                            </button>
                                        </div>
                                        <img 
                                            ref={imgRef} 
                                            src={selectedImage} 
                                            alt={locale === 'fa' ? datas.nameFa : datas.nameEn} 
                                            className="mx-auto w-auto object-contain max-h-[500px] max-w-full" 
                                        />
                                        {showLens && imgRef.current && (
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    top: lensPosition.y - 50,
                                                    left: lensPosition.x - 50,
                                                    width: '200px',
                                                    height: '200px',
                                                    borderRadius: '50%',
                                                    overflow: 'hidden',
                                                    border: '2px solid #ccc',
                                                    boxShadow: '0 0 5px rgba(0,0,0,0.3)',
                                                    pointerEvents: 'none',
                                                    backgroundImage: `url(${selectedImage})`,
                                                    backgroundRepeat: 'no-repeat',
                                                    backgroundSize: `${imgRef.current.width * zoom}px ${imgRef.current.height * zoom}px`,
                                                    backgroundPosition: `-${lensPosition.x * zoom - 50}px -${lensPosition.y * zoom - 50}px`,
                                                }}
                                            />
                                        )}
                                    </div>
                                </div>
                                <div className="gallery-scroll px-1 md:w-1/5 sm:w-full md:h-calc(100% - 150px) sm:h-auto md:block sm:flex md:mt-0 sm:mt-3 gap-2 overflow-auto md:space-y-3 sm:space-y-0">
                                    {gallery.map((imgUrl, index) => (
                                        <img
                                            key={index}
                                            src={imgUrl}
                                            alt={`Thumbnail ${index}`}
                                            className={`md:w-full sm:w-20 md:h-auto sm:h-auto object-contain md:p-2 sm:p-1 rounded cursor-pointer border ${
                                                selectedImage === imgUrl ? "border-gray-600" : "border-gray-400"
                                            }`}
                                            onClick={() => setSelectedImage(imgUrl)}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div dir={locale === "fa" ? "rtl" : "ltr"} className="md:w-2/5 sm:w-full">
                                {titleWords.length > 0 && (
                                    <motion.h1 dir={locale === "fa" ? "rtl" : "ltr"} variants={container} initial="hidden" animate="show" className="md:text-[40px] sm:text-[25px] font-bold md:mt-0 sm:mt-8 flex flex-wrap">
                                        {titleWords.map((word, idx) => (
                                            <span
                                                key={idx}
                                                className="overflow-hidden inline-block mb-2 text-[#47221C] md:h-[55px] sm:h-10"
                                            >
                                                <motion.span variants={wordd} className={`${idx === 0 ? 'md:mr-0 sm:mr-0' : `${locale === "fa" ? 'md:mr-3 sm:mr-2' : 'md:ml-3 sm:ml-2'}`} inline-block`}>
                                                    {word}
                                                </motion.span>
                                            </span>
                                        ))}
                                    </motion.h1>
                                )}

                                {/* Product Features — top 3, same style as bottom features */}
                                {features.length > 0 && (
                                    <div className="md:mt-5 sm:mt-3 w-full">
                                        <motion.ul initial="hidden" animate="show" variants={tableanime} className="mt-3">
                                            {features.slice(0, 3).map((box, boxIndex) => (
                                                <li key={boxIndex} className="border-b border-[#41241e] w-full flex gap-5 justify-between mt-3 pb-1 text-[#47221C] md:text-[14px] sm:text-[12px]">
                                                    <span>{locale === "fa" ? box.feature_fa_name : box.feature_en_name}</span>
                                                    <span>{locale === "fa" ? box.fa_value : box.en_value}</span>
                                                </li>
                                            ))}
                                        </motion.ul>
                                    </div>
                                )}

                                {/* Dynamic Option Axes (Wood, Fabric, Color, etc.) */}
                                {axes.map((axis, axisIndex) => {
                                    const activeVal = selectedOptions[axis.key];
                                    const activeOpt = axis.options?.find(o => o.value === activeVal);
                                    const activeLabel = locale === 'fa' ? (activeOpt?.label?.fa || activeVal) : (activeOpt?.label?.en || activeVal);
                                    const axisTitle = locale === 'fa' ? (axis.label?.fa || axis.key) : (axis.label?.en || axis.key);

                                    return (
                                        <div key={axisIndex} className="md:mt-6 sm:mt-3 w-full">
                                            <motion.p variants={tableanime} initial="hidden" animate="show" className="md:text-[18px] sm:text-[14px] flex flex-wrap text-[#47221C]">
                                                {axisTitle}
                                                {activeLabel && (
                                                    <span className="md:text-[15px] sm:text-[12px] mr-1">
                                                        : {activeLabel}
                                                    </span>
                                                )}
                                            </motion.p>

                                            <motion.div initial="hidden" animate="show" variants={tableanime} className="mt-3 flex flex-wrap gap-2">
                                                {axis.options?.map((opt, optIndex) => {
                                                    const isSelected = selectedOptions[axis.key] === opt.value;
                                                    const optLabel = locale === 'fa' ? (opt.label?.fa || opt.value) : (opt.label?.en || opt.value);

                                                    // Color Swatch
                                                    if (axis.type === 'color' || opt.colorHex) {
                                                        return (
                                                            <span 
                                                                key={optIndex}
                                                                title={optLabel}
                                                                onClick={() => handleOptionSelect(axis.key, opt.value, opt)}
                                                                style={{ backgroundColor: opt.colorHex || opt.value }} 
                                                                className={`rounded-full border-[1.5px] md:w-8 md:h-8 sm:w-6 sm:h-6 cursor-pointer shadow-md hover:shadow-2xl transition-all
                                                                    ${isSelected ? 'border-gray-900 scale-110 ring-2 ring-[#47221C]' : 'border-gray-300'}
                                                                `}
                                                            ></span>
                                                        );
                                                    }

                                                    // Image / Pattern Swatch (e.g. Wood texture or Fabric image)
                                                    if ((axis.type === 'swatch' || opt.images?.length > 0) && opt.images?.[0]) {
                                                        return (
                                                            <div 
                                                                key={optIndex}
                                                                title={optLabel}
                                                                onClick={() => handleOptionSelect(axis.key, opt.value, opt)}
                                                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded border cursor-pointer text-[13px] text-[#47221C] transition-all ${
                                                                    isSelected ? 'border-[#47221C] bg-[#47221C15] font-bold ring-1 ring-[#47221C]' : 'border-gray-300 bg-white/40'
                                                                }`}
                                                            >
                                                                <img src={opt.images[0]} alt={optLabel} className="w-5 h-5 object-cover rounded-full" />
                                                                <span>{optLabel}</span>
                                                            </div>
                                                        );
                                                    }

                                                    // Button / Text Pill
                                                    return (
                                                        <button 
                                                            key={optIndex}
                                                            onClick={() => handleOptionSelect(axis.key, opt.value, opt)}
                                                            className={`px-3 py-1 rounded text-[13px] border transition-all text-[#47221C] ${
                                                                isSelected ? 'border-[#47221C] bg-[#47221C15] font-bold ring-1 ring-[#47221C]' : 'border-gray-300 bg-white/40 hover:bg-white/70'
                                                            }`}
                                                        >
                                                            {optLabel}
                                                        </button>
                                                    );
                                                })}
                                            </motion.div>
                                        </div>
                                    );
                                })}

                                {/* Price & Stock Display */}
                                {(() => {
                                    const stockCount = currentVariant?.stock !== undefined ? currentVariant.stock : (datas.stock !== undefined ? datas.stock : 1);
                                    const inStock = currentVariant?.inStock !== undefined ? currentVariant.inStock : (stockCount > 0);
                                    const isAvailable = inStock && stockCount > 0;

                                    return (
                                        <>
                                            <div dir={locale === "fa" ? "rtl" : "ltr"} className="md:mt-8 sm:mt-4 w-full flex flex-wrap items-center justify-between gap-3">
                                                <motion.p variants={tableanime} initial="hidden" animate="show" className="font-bold md:text-[22px] sm:text-[16px] text-[#47221C]">
                                                    {new Intl.NumberFormat().format(price)} {locale === "fa" ? "تومان" : "IRT"} 
                                                </motion.p>

                                                {isAvailable ? (
                                                    <motion.span variants={tableanime} initial="hidden" animate="show" className="md:text-[14px] sm:text-[12px] text-emerald-800 bg-emerald-50 border border-emerald-300 px-3 py-1 rounded-full font-medium shadow-sm">
                                                        {locale === "fa" ? `موجودی در انبار: ${stockCount} عدد` : `Stock: ${stockCount} items available`}
                                                    </motion.span>
                                                ) : (
                                                    <motion.span variants={tableanime} initial="hidden" animate="show" className="md:text-[14px] sm:text-[12px] text-red-700 bg-red-50 border border-red-300 px-3 py-1 rounded-full font-bold shadow-sm">
                                                        {locale === "fa" ? `ناموجود` : `Out of Stock`}
                                                    </motion.span>
                                                )}
                                            </div>

                                            {/* Add to Basket or Out of Stock Button */}
                                            <div dir={locale === "fa" ? "rtl" : "ltr"} className="md:mt-5 sm:mt-3 w-full">
                                                <motion.div initial="hidden" animate="show" variants={tableanime}>
                                                    {!isAvailable ? (
                                                        <button 
                                                            disabled
                                                            className="bg-gray-200 text-gray-500 font-bold md:px-6 sm:px-4 md:py-2.5 sm:py-[8px] md:text-[15px] sm:text-[13px] rounded cursor-not-allowed border border-gray-300 select-none shadow-inner"
                                                        >
                                                            {locale === "fa" ? `ناموجود` : `Out of Stock`}
                                                        </button>
                                                    ) : addbtn === 0 ? (
                                                        <button 
                                                            onClick={handleAddToCart}
                                                            disabled={cartLoading}
                                                            className="border border-[#47221C] text-[#47221C] font-semibold md:px-5 sm:px-3 md:py-2.5 sm:py-[6px] md:text-[16px] sm:text-[13px] rounded hover:bg-[#47221C10] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                                        >
                                                            {cartLoading ? (
                                                                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                                                                </svg>
                                                            ) : null}
                                                            {locale === "fa" ? `افزودن به سبد خرید` : `Add to basket`}
                                                        </button>
                                                    ) : (
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-[120px] flex items-center justify-between py-1 px-3 border border-[#47221C] rounded bg-white/60 shadow-sm transition-opacity ${cartLoading ? "opacity-50" : ""}`}>
                                                                <button 
                                                                    className="px-2 font-bold text-lg text-[#47221C] hover:text-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                                                    onClick={handleDecreaseQty}
                                                                    disabled={cartLoading}
                                                                >
                                                                    {cartLoading ? "·" : "-"}
                                                                </button>
                                                                <span className="font-bold text-[#47221C] md:text-[16px] sm:text-[14px] min-w-[20px] text-center">
                                                                    {cartLoading ? (
                                                                        <svg className="animate-spin w-4 h-4 mx-auto" fill="none" viewBox="0 0 24 24">
                                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                                                                        </svg>
                                                                    ) : proCount}
                                                                </span>
                                                                <button 
                                                                    className="px-2 font-bold text-lg text-[#47221C] hover:text-green-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                                                    onClick={handleIncreaseQty}
                                                                    disabled={cartLoading}
                                                                >
                                                                    {cartLoading ? "·" : "+"}
                                                                </button>
                                                            </div>
                                                            <button 
                                                                onClick={handleDeleteFromCart}
                                                                disabled={cartLoading}
                                                                title={locale === "fa" ? "حذف از سبد خرید" : "Remove from cart"}
                                                                className="p-2.5 border border-red-300 text-red-600 rounded bg-red-50 hover:bg-red-600 hover:text-white transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                                                            >
                                                                <BiTrash size={20} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </motion.div>

                                                {/* Inline Toast Alert */}
                                                <AnimatePresence>
                                                    {cartToast && (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: -6 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0, y: -6 }}
                                                            className={`mt-3 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
                                                                cartToast.type === 'error' ? 'bg-red-50 border-red-300 text-red-800' :
                                                                cartToast.type === 'info' ? 'bg-blue-50 border-blue-300 text-blue-800' :
                                                                'bg-emerald-50 border-emerald-300 text-emerald-800'
                                                            }`}
                                                        >
                                                            {cartToast.type === 'error' ? (
                                                                <FaExclamationCircle className="text-base text-red-600 shrink-0" />
                                                            ) : (
                                                                <FaCheckCircle className="text-base text-emerald-600 shrink-0" />
                                                            )}
                                                            <span>{cartToast.message}</span>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </>
                                    );
                                })()}

                                {/* Modal after Add to Basket */}
                                {openModal && (
                                    <div className="fixed inset-0 bg-black bg-opacity-30 z-[100] flex items-end md:items-center md:mb-auto sm:-mb-2 justify-center">
                                        <section className="md:max-w-[700px] sm:w-full backdrop-blur-[20px] bg-[#FFFFFF90] rounded-xl p-4 md:pb-4 sm:pb-14 border border-redweb relative shadow-xl">
                                            <h1 className={`text-greenbtn font-bold md:text-[18px] sm:text-[14px] ${locale === "fa" ? 'md:pr-4 sm:pr-3 mr-2' : 'md:pl-4 sm:pl-3 ml-2'} relative`}>
                                                {locale === "fa" ? `این کالا به سبد خرید اضافه شد!` : `This product was added to basket`}
                                                <FaCheckCircle className={`absolute ${locale === "fa" ? 'md:-right-3 sm:-right-2' : 'md:-left-3 sm:-left-2'} top-0 md:text-2xl sm:text-lg text-[#47221C]`} />
                                            </h1>
                                            <span
                                                className={`${locale === "fa" ? 'left-4' : 'right-4'} absolute top-4 cursor-pointer`}
                                                onClick={() => setopenModal(false)}
                                            >
                                                <AiOutlineClose className="text-gray-800 text-lg" />
                                            </span>
                                            <hr className="my-2 border-gray-400" />
                                            <div className="flex items-center md:gap-4 sm:gap-2 mt-4">
                                                <img
                                                    src={selectedImage}
                                                    alt="shayegan"
                                                    className="md:w-36 md:h-36 sm:w-24 sm:h-24 object-contain rounded border"
                                                />
                                                <div>
                                                    <p className="md:text-[16px] sm:text-[13px] font-bold text-[#47221C]">
                                                        {locale === "fa" ? datas.nameFa : datas.nameEn}
                                                    </p>
                                                    {getActiveSelectionsSummary() && (
                                                        <p className="md:text-[14px] sm:text-[12px] font-medium text-[#47221C] mt-2">
                                                            {getActiveSelectionsSummary()}
                                                        </p>
                                                    )}
                                                    <p className="md:text-[15px] sm:text-[13px] font-bold text-[#47221C] mt-2">
                                                        {new Intl.NumberFormat().format(price)} {locale === "fa" ? "تومان" : "IRT"}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => router.push('/basket')}
                                                className="mt-4 w-full border border-[#47221C] bg-[#47221C] text-white hover:bg-[#341813] md:text-[18px] sm:text-[14px] font-bold py-2 rounded transition-colors"
                                            >
                                                {locale === "fa" ? `برو به سبد خرید` : `Direct to basket`}
                                            </button>
                                        </section>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                
                    {/* Section 2: Description & Specifications */}
                    <div dir={locale === "fa" ? "rtl" : "ltr"} className="relative md:mt-8 sm:mt-3 mb-16 w-[90%] ml-[5%]">
                        <motion.div variants={tableanime} initial="hidden" animate="show" style={{ background: datas.color || '#ffffff' }} className="border-b border-gray-500 flex gap-2 w-full mx-auto py-2 px-3 md:text-[18px] sm:text-[14px] text-[#47221C]">
                            <button className="mx-auto font-bold">
                                {locale === "fa" ? ` توضیحات ` : ` Description`}
                            </button>
                        </motion.div>
                        {/* <motion.p variants={tableanime} initial="hidden" animate="show" className="md:mt-7 sm:mt-5 md:text-[15px] sm:text-[12px] text-[#47221C] flex flex-wrap mt-3 leading-relaxed">
                           
                        </motion.p> */}
                         <motion.div className="md:mt-7 sm:mt-5 text-[#47221C]" variants={tableanime} initial="hidden" animate="show" dangerouslySetInnerHTML={{ __html:( `${locale === "fa" ? datas.descFa : datas.descEn}`)}}/> 

                        {features.length > 0 && (
                            <div className="mt-8">
                                <motion.h3 variants={tableanime} initial="hidden" animate="show" className="font-bold md:text-[18px] sm:text-[14px] text-[#47221C] mb-3 border-b border-gray-400 pb-2">
                                    {locale === "fa" ? "مشخصات محصول" : "Product Specifications"}
                                </motion.h3>
                                <motion.ul initial="hidden" animate="show" variants={tableanime}>
                                    {features.map((box, boxIndex) => {
                                        return (
                                            <li key={boxIndex} className="border-b border-[#41241e] w-full flex gap-5 justify-between mt-3 pb-1 text-[#47221C] md:text-[15px] sm:text-[12px]">
                                                <span>{locale === "fa" ? `${box.feature_fa_name}` : `${box.feature_en_name}`}</span>
                                                <span>{locale === "fa" ? `${box.fa_value}` : `${box.en_value}`}</span>
                                            </li>
                                        )
                                    })}
                                </motion.ul>
                            </div>
                        )}
                    </div>
                
                    {/* Section 3: Similar Products (Horizontal Slider) */}
                    {products.length > 0 && (
                        <div className="w-full relative px-4 pb-12">
                            <div className="flex items-center justify-between mb-4 w-[90%] mx-auto">
                                <h3 className="text-[#47221C] md:text-[20px] sm:text-[16px] font-bold">
                                    {locale === "fa" ? `محصولات مرتبط` : `Similar products`}
                                </h3>
                                <div className="flex gap-2" dir="ltr">
                                    <button 
                                        onClick={() => scrollSlider('left')} 
                                        className="p-2 rounded-full border border-gray-400 bg-white/70 hover:bg-white text-[#47221C] transition-colors shadow-sm cursor-pointer"
                                        title={locale === 'fa' ? 'قبلی' : 'Previous'}
                                    >
                                        <BiLeftArrowAlt size={22} />
                                    </button>
                                    <button 
                                        onClick={() => scrollSlider('right')} 
                                        className="p-2 rounded-full border border-gray-400 bg-white/70 hover:bg-white text-[#47221C] transition-colors shadow-sm cursor-pointer"
                                        title={locale === 'fa' ? 'بعدی' : 'Next'}
                                    >
                                        <BiRightArrowAlt size={22} />
                                    </button>
                                </div>
                            </div>

                            <div 
                                ref={sliderRef}
                                className="flex gap-4 overflow-x-auto py-4 px-2 w-[90%] mx-auto scroll-smooth no-scrollbar"
                                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                            >
                                {products.map((box, boxIndex) => (
                                    <SimilarProductCard 
                                        key={box._id || box.id || boxIndex}
                                        box={box}
                                        boxIndex={boxIndex}
                                        locale={locale}
                                        router={router}
                                        boxVariant={boxVariant}
                                        imageVariant={imageVariant}
                                        imageVariant2={imageVariant2}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    <Footer2/>
                </div>
            </>
            }
        </>
    );
}

function SimilarProductCard({ box, boxIndex, locale, router, boxVariant, imageVariant, imageVariant2 }) {
    const [hovered, setHovered] = useState(false);
    const [slideIdx, setSlideIdx] = useState(0);
    const [containerW, setContainerW] = useState(0);
    const [dragXVal, setDragXVal] = useState(0);
    const startXRef = useRef(null);
    const isDraggingX = useRef(false);
    const thresholdX = 80;

    const prodImages = box.images?.length ? box.images : [{ url: box.primaryImage || 'https://placehold.co/600x600?text=Product' }];

    const handleDragStart = (clientX) => {
        startXRef.current = clientX;
        isDraggingX.current = true;
    };

    const handleDragMove = (clientX) => {
        if (!isDraggingX.current) return;
        const diff = (clientX - startXRef.current) * 0.6;
        setDragXVal(diff);
    };

    const handleDragEnd = () => {
        if (!isDraggingX.current) return;
        const max = prodImages.length - 1;
        if (dragXVal < -thresholdX && slideIdx < max) {
            setSlideIdx(prev => prev + 1);
        } else if (dragXVal > thresholdX && slideIdx > 0) {
            setSlideIdx(prev => prev - 1);
        }
        isDraggingX.current = false;
        startXRef.current = null;
        setDragXVal(0);
    };

    const title = locale === "fa" ? (box.name?.fa || box.name) : (box.name?.en || box.name);
    const price = getMinPrice(box);

    return (
        <motion.div
            custom={boxIndex}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={boxVariant}
            className="flex-shrink-0 w-[280px] md:w-[320px] flex flex-col items-center relative select-none"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <motion.div className="relative w-full h-64 overflow-hidden rounded-lg bg-transparent border border-gray-300 shadow-sm hover:shadow-md transition-shadow">
                <div
                    style={{ width: "100%", overflow: "hidden", touchAction: "none", userSelect: "none" }}
                    onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
                    onTouchMove={(e) => handleDragMove(e.touches[0].clientX)}
                    onTouchEnd={handleDragEnd}
                    onMouseDown={(e) => { e.preventDefault(); handleDragStart(e.clientX); }}
                    onMouseMove={(e) => { if (isDraggingX.current) { e.preventDefault(); handleDragMove(e.clientX); }}}
                    onMouseUp={handleDragEnd}
                    onMouseLeave={handleDragEnd}
                >
                    <motion.div
                        style={{ display: "flex", cursor: "grab" }}
                        animate={{ x: -(slideIdx * (containerW || 280)) + dragXVal }}
                        transition={{ type: "spring", stiffness: 80, damping: 50, mass: 1 }}
                    >
                        {prodImages.map((imgItem, i) => (
                            <motion.div
                                key={i}
                                ref={(el) => el && i === 0 && setContainerW(el.offsetWidth)}
                                style={{ minWidth: "100%" }}
                                className="flex items-center justify-center relative"
                                variants={imageVariant}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true, amount: 0.3 }}
                            >
                                <img
                                    src={typeof imgItem === 'string' ? imgItem : (imgItem.url || imgItem.thumbnailUrl)}
                                    alt={`slide-${i}`}
                                    draggable={false}
                                    className="pointer-events-none h-64 md:w-[55%] sm:w-[70%] object-contain"
                                />
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
                {prodImages.length > 1 && (
                    <div className="absolute bottom-2 left-0 right-0 h-1 bg-gray-200 rounded-full mx-2">
                        <div
                            className="h-1 bg-gray-600 rounded-full transition-all duration-300"
                            style={{
                                width: `${((slideIdx + 1) / prodImages.length) * 100}%`,
                            }}
                        ></div>
                    </div>
                )}

                <motion.button
                    initial={{ opacity: 1, y: -43 }}
                    animate={hovered ? { opacity: 1, y: 1 } : { opacity: 1, y: -43 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="absolute flex gap-[1px] top-2 right-2 text-white cursor-pointer z-10"
                    onClick={() => {
                        const targetSlug = box.slug || box._id || box.id;
                        if (targetSlug) router.push(`/product/${targetSlug}`);
                    }}
                >
                    <motion.p
                        initial={{ scale: 1 }}
                        whileHover={{ scale: 1.05 }}
                        className="text-white px-2 py-1 rounded-sm shadow text-[13px] bg-[#222222] inline-flex"
                    >
                        {locale === "fa" ? "مشاهده" : "explore"}
                    </motion.p>
                    <span className="text-white">
                        <BiRightArrowAlt
                            size={30}
                            className="text-white px-[7px] h-[27.5px] rounded-sm shadow bg-[#222222] inline-flex"
                        />
                    </span>
                </motion.button>

                <motion.p 
                    variants={imageVariant2}
                    className="absolute left-2 bottom-5 md:text-[14px] sm:text-[12px] font-medium text-gray-700 bg-white/80 backdrop-blur-md p-1 px-2 rounded-sm border border-gray-300 shadow-sm"
                >
                    {title}
                </motion.p>
                <motion.p 
                    dir={locale === "fa" ? "rtl" : "ltr"}
                    variants={imageVariant2}
                    className="absolute left-2 top-2.5 md:text-[14px] sm:text-[12px] font-bold text-gray-800 bg-white/80 backdrop-blur-md p-1 px-2 rounded-sm border border-gray-300 shadow-sm"
                >
                    {new Intl.NumberFormat().format(price)} {locale === "fa" ? "تومان" : "IRT"} 
                </motion.p>
            </motion.div>
        </motion.div>
    );
}

export default function Product(props) {
    return (
        <React.Suspense fallback={<LoadingBox />}>
            <ProductContent {...props} />
        </React.Suspense>
    );
}