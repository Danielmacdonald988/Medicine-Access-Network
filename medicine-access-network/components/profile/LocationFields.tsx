'use client'
import { LOCATION_COUNTRIES, countryFor, regionValue, type ProfileLocation } from '@/lib/locations'
import { useTranslation } from '@/components/i18n/TranslationProvider'

export function LocationFields({value,onChange,error}: {value:ProfileLocation[];onChange:(value:ProfileLocation[])=>void;error?:string}) {
  const { t } = useTranslation()
  const update = (index:number, patch:Partial<ProfileLocation>) => onChange(value.map((item,i)=>i===index ? {...item,...patch} : item))
  const fieldClass = 'mt-1 block min-h-11 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm'
  return <div className="space-y-4">
    <p className="text-sm text-stone-600">{t('Add each place separately. Choose your country and state or province, then enter the city or town.')}</p>
    {value.map((item,index)=><fieldset key={index} className="space-y-3 rounded-xl border border-stone-200 p-4">
      <legend className="px-1 text-sm font-medium">{t('Location')} {index+1}</legend>
      <label className="block text-sm">{t('Country')}<select className={fieldClass} value={item.country} onChange={event=>update(index,{country:event.target.value,region:''})}>
        <option value="">{t('Choose a country')}</option>
        {LOCATION_COUNTRIES.map(country=><option key={country.countryShortCode} value={country.countryShortCode}>{country.countryName}</option>)}
      </select></label>
      {Boolean(countryFor(item.country)?.regions.length) && <label className="block text-sm">{t('State / province / region')}<select className={fieldClass} value={item.region} onChange={event=>update(index,{region:event.target.value})}>
        <option value="">{t('Choose a state or region')}</option>
        {countryFor(item.country)?.regions.map(region=><option key={regionValue(region)} value={regionValue(region)}>{region.name}{region.shortCode ? ` (${region.shortCode})` : ''}</option>)}
      </select></label>}
      <label className="block text-sm">{t('City / town')}<input className={fieldClass} value={item.city} maxLength={100} autoComplete="address-level2" placeholder={t('City or town only')} onChange={event=>update(index,{city:event.target.value})} /></label>
      {value.length>1 && <button type="button" className="text-sm underline" onClick={()=>onChange(value.filter((_,i)=>i!==index))}>{t('Remove location')} {index+1}</button>}
    </fieldset>)}
    {value.length<5 && <button type="button" className="rounded-md border border-stone-300 px-3 py-2 text-sm" onClick={()=>onChange([...value,{city:'',country:'',region:''}])}>{t('Add another location')}</button>}
    {error && <p role="alert" className="text-sm text-red-700">{t(error)}</p>}
  </div>
}
