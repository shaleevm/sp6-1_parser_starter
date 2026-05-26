// @todo: напишите здесь код парсера
function parseMeta() {
  const meta = {};

  const langAttribute = document.querySelector("html");
  if (langAttribute.hasAttribute("lang"))
    meta.language = langAttribute.getAttribute("lang");

  const headCollection = document.querySelector("head").children;

  /* перебираем все теги в head и выбираем нужные */
  Array.from(headCollection).forEach((element) => {
    if (element.tagName.toLowerCase() === "title") {
      //const arrTitle = element.textContent;
      meta.title = element.textContent.split(/\s*[-–—]\s*/)[0].trim();
    }

    if (
      element.tagName.toLowerCase() === "meta" &&
      element.getAttribute("name") === "description"
    ) {
      meta.description = element.getAttribute("content").trim();
    }

    if (
      element.tagName.toLowerCase() === "meta" &&
      element.getAttribute("name") === "keywords"
    ) {
      meta.keywords = element
        .getAttribute("content")
        .split(",")
        .map((item) => item.trim());
    }

    if (
      element.tagName.toLowerCase() === "meta" &&
      element.getAttribute("property") === "og:title"
    ) {
      meta.opengraph ??= {};
      meta.opengraph.title = element
        .getAttribute("content")
        .split(/\s*[-–—]\s*/)[0]
        .trim();
    }

    if (
      element.tagName.toLowerCase() === "meta" &&
      element.getAttribute("property") === "og:image"
    ) {
      meta.opengraph ??= {};
      meta.opengraph.image = element.getAttribute("content").trim();
    }

    if (
      element.tagName.toLowerCase() === "meta" &&
      element.getAttribute("property") === "og:type"
    ) {
      meta.opengraph ??= {};
      meta.opengraph.type = element.getAttribute("content").trim();
    }
  });

  return meta;
}

function parseProduct() {
  const product = {};

  /* выполняем обработку в блоке с классом product */
  const productNode = document.querySelector(".product");
  product.id = productNode.dataset.id;
  product.name = productNode.querySelector("h1").textContent;

  product.isLiked = productNode
    .querySelector("button.like")
    .classList.contains("active");

  const tagsNode = productNode.querySelector(".tags").children;
  
  if (tagsNode.length > 0) {
    product.tags = { category: [], discount: [], label: [] };

    Array.from(tagsNode).forEach((element) => {
      
      if (element.className === "green") {
        const tagContent = element.textContent.trim();
        // добавляем значение только если его ещё нет в массиве
        if (!product.tags.category.includes(tagContent)) {
          product.tags.category.push(tagContent);
        }
      }

      if (element.className === "red") {
        const tagDiscount = element.textContent.trim();
        // добавляем значение только если его ещё нет в массиве
        if (!product.tags.discount.includes(tagDiscount)) {
          product.tags.discount.push(tagDiscount);
        }
      }

      if (element.className === "blue") {
        const tagLabel = element.textContent.trim();
        // добавляем значение только если его ещё нет в массиве
        if (!product.tags.label.includes(tagLabel)) {
          product.tags.label.push(tagLabel);
        }
      }
    });
  }

  /* обработка цены товара */

  const priceNode = productNode.querySelector(".price");
  const priceParts = priceNode.innerHTML.split("<span>");
  const newPrice = +priceParts[0].match(/\d+/);
  const oldPrice = +priceParts[1].match(/\d+/) ?? 0;
  const diffDiscount = oldPrice - newPrice;

  product.price = newPrice;
  product.oldPrice = oldPrice;

  if (diffDiscount > 0) {
    product.discount = diffDiscount;
    product.discountPercent =
      ((diffDiscount / oldPrice) * 100).toFixed(2) + "%";
  } else {
    product.discount = 0;
    product.discountPercent = "0%";
  }

  const currency = priceParts[0].match(/[^\d\s](?=\d+)/)?.[0];
  if (currency) {
    switch (currency) {
      case "₽":
        product.currency = "RUB";
        break;
      case "$":
        product.currency = "USD";
        break;
      case "€":
        product.currency = "EUR";
        break;
    }
  }

  /* добавляем свойства товара - ключ properties */

  const propertiesNode = productNode.querySelector(".properties").children;
  product.properties = {};

  Array.from(propertiesNode).forEach((li) => {
    const spans = li.querySelectorAll("span");
    if (spans.length >= 2) {
      const key = spans[0].textContent.trim();
      const value = spans[1].textContent.trim();
      product.properties[key] = value;
    }
  });

  /* добавляем ключ product.description */
  const descriptionNode = productNode.querySelector(".description");

  if (descriptionNode) {
    // клонируем контейнер, чтобы не менять оригинал в DOM
    const clone = descriptionNode.cloneNode(true);

    // удаляем все атрибуты у всех элементов внутри клона
    clone.querySelectorAll("*").forEach((element) => {
      Array.from(element.attributes).forEach((attr) => {
        element.removeAttribute(attr.name);
      });
    });

    // берём innerHTML клона — это сохраняет исходное форматирование
    product.description = clone.innerHTML.trim();
  } else {
    product.description = "";
  }

  /* добавляем ключ images */
  const imagesNode = productNode.querySelector("nav").querySelectorAll("img");
  //console.log("img", imagesNode);

  /* получаем image по умолчанию */
  const defaultImage = productNode
    .querySelector(".preview figure img")
    .getAttribute("src");

  product.images = Array.from(imagesNode).reduce((acc, elem) => {
    /* если изображение по умолчанию совпадает с текущим, 
    то добавляем его на первую позицию */
    elem.dataset.src === defaultImage
      ? acc.unshift({
          preview: elem.src,
          full: elem.dataset.src,
          alt: elem.alt,
        })
      : acc.push({ preview: elem.src, full: elem.dataset.src, alt: elem.alt });
    return acc;
  }, []);

  return product;
}

function parseSuggested() {
  const suggestedArticles = document
    .querySelector(".suggested")
    .querySelectorAll("article");

    /* перебираем все articles в блоке с классом suggested */
  const suggestedArr = Array.from(suggestedArticles).map((elem) => {
    const articleNew = Array.from(elem.children);
    const newObj = {};
    articleNew.forEach((subElem) => {
      if (subElem.tagName.toLowerCase() === "h3") {
        newObj.name = subElem.textContent.trim();
      }

      if (subElem.tagName.toLowerCase() === "p") {
        newObj.description = subElem.textContent.trim();
      }

      if (subElem.tagName.toLowerCase() === "img") {
        newObj.image = subElem.getAttribute("src").trim();
      }

      if (subElem.tagName.toLowerCase() === "b") {
        const currencyArr = [...subElem.textContent.trim()];

        switch (currencyArr[0]) {
          case "₽":
            newObj.currency = "RUB";
            break;
          case "$":
            newObj.currency = "USD";
            break;
          case "€":
            newObj.currency = "EUR";
            break;
        }

        newObj.price = currencyArr.slice(1).join("");
      }
    });

    return newObj;
  });

  return suggestedArr;
}

function parseReviews() {
  const reviewArticles = document
    .querySelector(".reviews")
    .querySelectorAll("article");

    /* перебираем все articles в блоке с классом reviews */
  const reviewArr = Array.from(reviewArticles).map((elem) => {
    const reviewObj = {};
    reviewObj.title = elem.querySelector("h3").textContent.trim();
    reviewObj.description = elem
      .querySelector("h3")
      .nextElementSibling.textContent.trim();

    reviewObj.rating = Array.from(
      elem.querySelector(".rating").children,
    ).reduce((acc, rate) => {
      rate.className === "filled" ? acc++ : acc;
      return acc;
    }, 0);

    const authorNode = elem.querySelector(".author");

    reviewObj.date = authorNode
      .querySelector("i")
      .textContent.trim()
      .replaceAll("/", ".");

    const name = authorNode.querySelector("span").textContent.trim();
    const avatar = authorNode.querySelector("img").getAttribute("src").trim();

    reviewObj.author = { name, avatar };

    return reviewObj;
  });
  return reviewArr;
}

function parsePage() {
  return {
    meta: parseMeta(),
    product: parseProduct(),
    suggested: parseSuggested(),
    reviews: parseReviews(),
  };
}

window.parsePage = parsePage;
