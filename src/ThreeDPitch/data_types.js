export const dataTypes = {
  number: {
    display: (value) => {
      if (!value && value !== 0) return null
      value = Number(value)
      if (isNaN(value)) return null
      return value
    },
    parse: (value) => {
      if (!value && value !== 0) return null
      value = Number(value)
      if (isNaN(value)) return null
      return value
    }
  },
  text: {
    display: (value) => {
      if (!value) return null
      value = String(value)
      return value
    },
    parse: (value) => {
      if (!value) return null
      value = String(value)
      return value
    }
  },
  json: {
    display: (value) => {
      if (!value) return null
      value = JSON.stringify(value)
      return value
    },
    parse: (value) => {
      if (!value) return null
      try {
        value = JSON.parse(value)
      } catch(e) {
        value = null
      }
      return value
    }
  },
  eNum: {
    display: (value, options) => {
      if (!value) return null
      let option = options.find(option => option.value === value)
      if (!option) return null
      return option.name
    },
    parse: (value, options) => {
      if (!value) return null
      let option = options.find(option => option.name === value)
      if (!option) return null
      return option.value
    }
  },
  date: {
    display: (value) => {

    },
    parse: (value) => {

    }
  }
}
