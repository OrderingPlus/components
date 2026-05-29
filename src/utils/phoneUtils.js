let _parser = null
let _metadata = null
let _loading = null

const ensurePhoneCore = () => {
  if (_parser && _metadata) {
    return Promise.resolve({ parse: _parser, metadata: _metadata })
  }

  if (!_loading) {
    _loading = Promise.all([
      import('libphonenumber-js/min'),
      import('libphonenumber-js/metadata.min.json')
    ]).then(([parseMod, metadataMod]) => {
      _parser = parseMod.default
      _metadata = metadataMod.default || metadataMod
      return { parse: _parser, metadata: _metadata }
    })
  }

  return _loading
}

export const preloadPhoneCore = () => ensurePhoneCore()

export const parsePhoneNumber = async (value, options) => {
  const { parse, metadata } = await ensurePhoneCore()
  return parse(value, options, metadata)
}

export const parsePhoneNumberSync = (value, options) => {
  if (!_parser || !_metadata) return null
  return _parser(value, options, _metadata)
}

export const getPhoneMetadata = async () => (await ensurePhoneCore()).metadata

export const loadParsePhoneNumber = async () => {
  const { parse, metadata } = await ensurePhoneCore()
  return (value, options) => parse(value, options, metadata)
}
