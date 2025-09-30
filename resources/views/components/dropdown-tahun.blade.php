<select class="form-control select2-custom {{$class}}" name="{{ $name }}" data-selected="{{$selected}}" {{$disabled}}>
    @foreach($periode as $item)
        @php($select = '')
        @if($selected)
            @if($item->periode == $selected)
                @php($select = 'selected')
            @endif
        @else
            @if($item->periode == date('Y'))
                @php($select = 'selected')
            @endif
        @endif
        <option {{$select}} value="{{$item->periode}}">{{$item->periode}}</option>
    @endforeach
</select>
