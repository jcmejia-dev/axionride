import { LocationService } from '@/src/services/location';
import { BaseService } from '@/src/services/BaseService';
import type { ServiceContext } from '@/src/services/ServiceContext';
import type { ServiceResult } from '@/src/services/ServiceTypes';

export type CurrentWeather={readonly temperatureCelsius:number;readonly weatherCode:number;readonly windKmh:number;readonly precipitationMm:number};
type Response={current?:{temperature_2m?:number;weather_code?:number;wind_speed_10m?:number;precipitation?:number}};
export class WeatherService extends BaseService{
  private readonly location:LocationService;
  constructor(context:ServiceContext){super(context);this.location=new LocationService(context)}
  async getCurrentWeather():Promise<ServiceResult<CurrentWeather>>{
    const permission=await this.location.requestForegroundPermission();
    if(!permission.ok||permission.value.state!=='granted')return this.failure({code:'unavailable',message:'Location permission is required for local weather.'});
    const point=await this.location.getCurrentLocation();if(!point.ok)return this.failure(point.error);
    try{const url=`https://api.open-meteo.com/v1/forecast?latitude=${point.value.latitude}&longitude=${point.value.longitude}&current=temperature_2m,weather_code,wind_speed_10m,precipitation&temperature_unit=celsius&wind_speed_unit=kmh`;const response=await fetch(url);if(!response.ok)throw new Error(`Weather request failed (${response.status})`);const data=await response.json() as Response;const current=data.current;if(!current||typeof current.temperature_2m!=='number')throw new Error('Current weather was unavailable.');return this.success({temperatureCelsius:current.temperature_2m,weatherCode:current.weather_code??0,windKmh:current.wind_speed_10m??0,precipitationMm:current.precipitation??0})}catch(cause){return this.failure({code:'unavailable',message:'Local weather is unavailable while offline.',cause})}
  }
}
